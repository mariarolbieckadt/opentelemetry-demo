// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as S from './Banner.styled';

const Banner = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(
          'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging/images?key=Banner.png'
        );
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      } catch (error) {
        console.error('Failed to load banner image:', error);
      }
    };

    fetchImage();
  }, []);

  return (
    <S.Banner>
      <S.ImageContainer>
        {imageSrc && <S.BannerImg src={imageSrc} alt="Banner" />}
      </S.ImageContainer>
      <S.TextContainer>
        <S.Title>The best telescopes to see the world closer</S.Title>
        <Link href="#hot-products"><S.GoShoppingButton>Go Shopping</S.GoShoppingButton></Link>
      </S.TextContainer>
    </S.Banner>
  );
};

export default Banner;
