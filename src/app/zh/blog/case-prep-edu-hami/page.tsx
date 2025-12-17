"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrepEduHamiCasePage from '../../../blog/case-prep-edu-hami/page';

export default function ZhPrepEduHamiCasePage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage('zh');
  }, [i18n]);

  return <PrepEduHamiCasePage />;
}

