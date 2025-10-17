// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { CypressFields } from '../../utils/Cypress';
import { Product } from '../../protos/demo';
import ProductPrice from '../ProductPrice';
import * as S from './ProductCard.styled';
import { useState, useEffect } from 'react';
import { useNumberFlagValue } from '@openfeature/react-sdk';

import { useEffect, useState } from 'react';
import * as S from './styled';
import { ProductPrice } from './ProductPrice';
import { CypressFields } from './cypress-fields';
import { useNumberFlagValue } from './useNumberFlagValue';

interface IProps {
  product: {
    id: string;
    picture?: string; // not used anymore, but kept for compatibility
    name: string;
    priceUsd?: {
      currencyCode: string;
      units: number;
      nanos: number;
    };
  };
}

const IMAGE_API_BASE = 'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging';
const SCREEN = '860x600';

const ProductCard = ({
  product: {
    id,
    name,
    priceUsd = {
      currencyCode: 'USD',
      units: 0,
      nanos: 0,
    },
  },
}: IProps) => {
  const imageSlowLoad = useNumberFlagValue('imageSlowLoad', 0);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);

        const url = new URL('/images/presign', IMAGE_API_BASE);
        url.searchParams.set('productId', id);
        url.searchParams.set('screen', SCREEN);

        const headers = new Headers();
        headers.append('x-envoy-fault-delay-request', imageSlowLoad.toString());
        headers.append('Cache-Control', 'no-cache');

        const res = await fetch(url.toString(), { method: 'GET', headers });
        if (!res.ok) throw new Error(`Presign failed: ${res.status}`);

        const data = await res.json();
        if (!data?.url) throw new Error('No presigned URL in response');

        if (!cancelled) setImageSrc(data.url); // direct S3 presigned URL
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Image load error');
          setImageSrc(''); // optional: set to a local placeholder here
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, imageSlowLoad]);

  return (
    <S.Link href={`/product/${id}`}>
      <S.ProductCard data-cy={CypressFields.ProductCard}>
        <S.Image $src={imageSrc} alt={name} data-error={error || undefined} />
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