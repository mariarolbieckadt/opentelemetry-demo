import { CypressFields } from '../../utils/Cypress';
import ProductPrice from '../ProductPrice';
import * as S from './ProductCard.styled';
import { useState, useEffect } from 'react';
import { useNumberFlagValue } from '@openfeature/react-sdk';
interface IProps {
  product: {
    id: string;
    picture?: string; // not used; Lambda looks it up
    name: string;
    priceUsd?: {
      currencyCode: string;
      units: number;
      nanos: number;
    };
  };
}

interface PresignResponse {
  url: string;
  bucket?: string;
  key?: string;
  screen?: string;
  expiresIn?: number;
}

// Type guard to avoid `any` when checking JSON shape
function isPresignResponse(x: unknown): x is PresignResponse {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  return typeof rec.url === 'string';
}

// Your base already includes /staging/images
const IMAGE_API_BASE =
  'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging/images/';

const SCREEN = '860x600';

const ProductCard = ({
  product: {
    id,
    name,
    priceUsd = { currencyCode: 'USD', units: 0, nanos: 0 },
  },
}: IProps) => {
  const imageSlowLoad = useNumberFlagValue('imageSlowLoad', 0);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);

        // Because base includes /images, DO NOT start with "/"
        const endpoint = new URL(IMAGE_API_BASE);
        endpoint.searchParams.set('productId', id);
        endpoint.searchParams.set('screen', SCREEN);

        const headers = new Headers();
        headers.set('x-envoy-fault-delay-request', String(imageSlowLoad));
        headers.set('Cache-Control', 'no-cache');
        headers.set('Accept', 'application/json');

        const res = await fetch(endpoint.toString(), { method: 'GET', headers });
        if (!res.ok) {
          throw new Error(`Presign failed: ${res.status} ${res.statusText}`);
        }

        const json: unknown = await res.json();
        if (!isPresignResponse(json)) {
          throw new Error('Invalid response from presign endpoint');
        }

        if (!cancelled) {
          setImageSrc(json.url); // direct S3 presigned URL
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Image load error';
          setError(message);
          setImageSrc(''); // or set a local placeholder
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, imageSlowLoad]);

  return (
    <S.Link href={`/product/${id}`}>
      <S.ProductCard data-cy={CypressFields.ProductCard}>
        {/* If S.Image is a styled <img>, use `src={imageSrc}` instead of `$src` */}
        <S.Image $src={imageSrc} data-error={error || undefined} />
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