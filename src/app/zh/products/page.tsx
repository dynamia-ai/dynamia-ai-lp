"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Products from '../../products/page';

export default function ZhProductsPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <Products />;
} 