import { CypressFields } from '../../utils/Cypress';
import { Product } from '../../protos/demo';
import ProductPrice from '../ProductPrice';
import * as S from './ProductCard.styled';
import { useState, useEffect } from 'react';
import { useNumberFlagValue, useBooleanFlagValue } from '@openfeature/react-sdk';

interface IProps {
  product: Product;
}

async function getImageWithHeaders(requestInfo: Request) {
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
  //const largeImage = useBooleanFlagValue('largeImage', false);
  const largeImage = true;
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    console.log(`Feature Flags - imageSlowLoad: ${imageSlowLoad}, largeImage: ${largeImage}`);

    const loadImage = async () => {
      if (imageSlowLoad > 0) {
        console.log(`Sleeping for ${imageSlowLoad}ms due to imageSlowLoad flag`);
        await new Promise(resolve => setTimeout(resolve, imageSlowLoad));
      }

      const headers = new Headers();
      headers.append('Cache-Control', 'no-cache');

      const imagePath = largeImage
        ? 'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging/images?key='
        : '/images/products/';
      const imageUrl = imagePath + picture;

      console.log(`ImageURL: ${imageUrl}`);

      const requestInfo = new Request(imageUrl, {
        method: 'GET',
        headers: headers,
      });

      try {
        const blob = await getImageWithHeaders(requestInfo);
        setImageSrc(URL.createObjectURL(blob));
      } catch (error) {
        console.error('Failed to load image:', error);
      }
    };

    loadImage();
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
