'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentLocale = pathname?.startsWith('/zh') ? 'zh' : 'en';

  // 根据当前语言获取正确的链接
  const getLocalizedHref = (path: string) => {
    return currentLocale === 'zh' ? `/zh${path}` : path;
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center -mx-5 -my-2" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href={getLocalizedHref('/')} className="text-base text-gray-500 hover:text-gray-900">
              {t('navigation.home')}
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href={getLocalizedHref('/products')} className="text-base text-gray-500 hover:text-gray-900">
              {t('navigation.products')}
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href={getLocalizedHref('/solutions')} className="text-base text-gray-500 hover:text-gray-900">
              {t('navigation.solutions')}
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href={getLocalizedHref('/resources')} className="text-base text-gray-500 hover:text-gray-900">
              {t('navigation.resources')}
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href={getLocalizedHref('/company')} className="text-base text-gray-500 hover:text-gray-900">
              {t('navigation.company')}
            </Link>
          </div>
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          {/* Social Media Links (Optional) */}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between">
          <p className="text-center text-base text-gray-400">{t('footer.copyright')}</p>
          <div className="mt-4 sm:mt-0 text-center sm:text-right">
            <Link href={getLocalizedHref('/privacy-policy')} className="text-sm text-gray-400 mr-4 hover:text-gray-500">
              {t('footer.privacyPolicy')}
            </Link>
            <Link href={getLocalizedHref('/terms-of-service')} className="text-sm text-gray-400 hover:text-gray-500">
              {t('footer.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 