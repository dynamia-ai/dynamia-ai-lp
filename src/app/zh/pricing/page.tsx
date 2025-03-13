"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PricingPage from '../../pricing/page';

export default function ZhPricingPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <PricingPage />;
} 