"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TelecomGpuCasePage from '../../../blog/case-telecom-gpu/page';

export default function ZhTelecomGpuCasePage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <TelecomGpuCasePage />;
} 