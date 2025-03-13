"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Resources from '../../resources/page';

export default function ZhResourcesPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <Resources />;
} 