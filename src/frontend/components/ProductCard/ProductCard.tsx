// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { CypressFields } from '../../utils/Cypress';
import { Product } from '../../protos/demo';
import ProductPrice from '../ProductPrice';
import * as S from './ProductCard.styled';
import { useState, useEffect } from 'react';
import { useNumberFlagValue, useBooleanFlagValue } from '@openfeature/react-sdk';

interface IProps {
  product: Product;
}

async function getImageWithHeaders(requestInfo: Request, delayMs: number) {
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  const res = await fetch(requestInfo);
  return await res.blob();
}

const ProductCard = ({
  product: {
    id,
    picture,
    name,
    priceUsd = {
      currencyCode: 'USD',
      units: 0,
      nanos: 0,
    },
  },
}: IProps) => {
  const imageSlowLoad = useNumberFlagValue('imageSlowLoad', 0);
  const largeImage = useBooleanFlagValue('largeImage', false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    if (largeImage) {
      console.warn(`Flag 'largeImage' is enabled. Using BMP format for image: ${picture}`);
    }
    if (imageSlowLoad !== 0) {
      console.warn(`Flag 'imageSlowLoad' is set to ${imageSlowLoad}ms. Simulating delayed image load.`);
    }

    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache');

    const requestInit = {
      method: 'GET',
      headers: headers,
    };

    const imagePath = largeImage
      ? 'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging/images?key='
      : '/images/products/'

    const imageUrl = imagePath + picture;
    const requestInfo = new Request(imageUrl, requestInit);

    getImageWithHeaders(requestInfo, imageSlowLoad).then(blob => {
      setImageSrc(URL.createObjectURL(blob));
    });
  }, [imageSlowLoad, largeImage, picture]);

  return (
    <S.Link href={`/product/${id}`}>
      <S.ProductCard data-cy={CypressFields.ProductCard}>
        <S.Image $src={imageSrc} />
        <div>
          <S.ProductName>{name}</S.ProductName>
          <S.ProductPrice>
            <ProductPrice price={priceUsd} />
          </S.ProductPrice>
        </div>
      </S.ProductCard>
    </S.Link>
  );
};

export default ProductCard;
