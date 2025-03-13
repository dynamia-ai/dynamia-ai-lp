"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Home from '../page';

export default function ZhHomePage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <Home />;
} 