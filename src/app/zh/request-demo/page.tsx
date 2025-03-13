"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RequestDemo from '../../request-demo/page';

export default function ZhRequestDemoPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <RequestDemo />;
} 