"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Company from '../../company/page';

export default function ZhCompanyPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <Company />;
} 