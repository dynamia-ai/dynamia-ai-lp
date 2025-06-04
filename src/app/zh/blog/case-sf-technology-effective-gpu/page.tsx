"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SfTechnologyEffectiveGpuCasePage from '../../../blog/case-sf-technology-effective-gpu/page';

export default function ZhSfTechnologyEffectiveGpuCasePage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <SfTechnologyEffectiveGpuCasePage />;
} 