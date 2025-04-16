// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0
const {
  context,
  propagation,
  trace,
  metrics,
} = require("@opentelemetry/api");
const valid = require("card-validator");
const { v4: uuidv4 } = require("uuid");

const { OpenFeature } = require("@openfeature/server-sdk");
const {
  FlagdProvider,
} = require("@openfeature/flagd-provider");
const flagProvider = new FlagdProvider();

const logger = require("./logger");
const tracer = trace.getTracer("payment");
const meter = metrics.getMeter("payment");
const transactionsCounter = meter.createCounter(
  "app.payment.transactions"
);

const LOYALTY_LEVEL = [
  "platinum",
  "gold",
  "silver",
  "bronze",
];

/** Return random element from given array */
function random(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

module.exports.charge = async (request) => {
  const span = tracer.startSpan("charge");

  await OpenFeature.setProviderAndWait(flagProvider);

  const numberVariant =
    await OpenFeature.getClient().getNumberValue(
      "paymentFailure",
      0
    );

  if (numberVariant > 0) {
    // n% chance to fail with app.loyalty.level=gold
    if (Math.random() < numberVariant) {
      span.setAttributes({ "app.loyalty.level": "gold" });
      span.end();

      throw new Error(
        "Payment request failed. Invalid token. app.loyalty.level=gold"
      );
    }
  }

  const {
    creditCardNumber: number,
    creditCardExpirationYear: year,
    creditCardExpirationMonth: month,
  } = request.creditCard;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const lastFourDigits = number.substr(-4);
  const transactionId = uuidv4();

  const cardValidation = valid.number(number);

  const loyalty_level = random(LOYALTY_LEVEL);
  span.setAttributes({
    "app.payment.card_type": cardValidation.card.type,
    "app.payment.card_valid": cardValidation.isValid,
    "app.loyalty.level": loyalty_level,
  });

  if (!cardValidation.isValid) {
    throw new Error("Credit card info is invalid.");
  }

  const supportedCards =
    await OpenFeature.getClient().getObjectValue(
      "paymentSupportedCardsProblem",
      {}
    );

  if (!supportedCards[cardValidation.card.type]) {
    const supportedCardNames =
      Object.values(supportedCards).join(", ");

    throw new Error(
      `Sorry, we cannot process ${cardValidation.card.niceType} credit cards.
      Only ${supportedCardNames} are supported.`
    );
  }

  if (currentYear * 12 + currentMonth > year * 12 + month) {
    throw new Error(
      `The credit card (ending ${lastFourDigits}) expired on ${month}/${year}.`
    );
  }

  // Check baggage for synthetic_request=true, and add charged attribute accordingly
  const baggage = propagation.getBaggage(context.active());
  if (
    baggage &&
    baggage.getEntry("synthetic_request") &&
    baggage.getEntry("synthetic_request").value === "true"
  ) {
    span.setAttribute("app.payment.charged", false);
  } else {
    span.setAttribute("app.payment.charged", true);
  }

  const cardType = cardValidation.card.type;

  const { units, nanos, currencyCode } = request.amount;
  logger.info(
    {
      transactionId,
      cardType,
      lastFourDigits,
      amount: { units, nanos, currencyCode },
      loyalty_level,
    },
    "Transaction complete."
  );
  transactionsCounter.add(1, {
    "app.payment.currency": currencyCode,
  });
  span.end();

  return { transactionId };
};
