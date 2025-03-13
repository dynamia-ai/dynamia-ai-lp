"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FreeTrial from '../../free-trial/page';

export default function ZhFreeTrialPage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <FreeTrial />;
} 