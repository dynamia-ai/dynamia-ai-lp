"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import KantaloupeProduct from '../../../products/kantaloupe/page';

export default function ZhKantaloupeProductPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <KantaloupeProduct />;
} 