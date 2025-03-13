"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Solutions from '../../solutions/page';

export default function ZhSolutionsPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <Solutions />;
} 