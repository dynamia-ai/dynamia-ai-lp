'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentLocale = pathname?.startsWith('/zh') ? 'zh' : 'en';

  // Get localized href based on current language
  const getLocalizedHref = (path: string) => {
    return currentLocale === 'zh' ? `/zh${path}` : path;
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex flex-wrap">
          {/* Left section (2/3 width) with two columns */}
          <div className="w-full md:w-2/3">
            <div className="flex flex-wrap">
              {/* First column - Company */}
              <div className="w-full sm:w-1/2 mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4">{t('footer.company')}</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href={getLocalizedHref('/company')} className="text-base text-gray-500 hover:text-gray-900">
                      {t('footer.aboutUs')}
                    </Link>
                  </li>
                  <li>
                    <Link href="mailto:info@dynamia.ai" className="text-base text-gray-500 hover:text-gray-900">
                      {t('footer.contactUs')}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Second column - Dynamia AI Platform */}
              <div className="w-full sm:w-1/2 mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4">{t('footer.platformTitle')}</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href={currentLocale === 'zh' ? "https://www.bilibili.com/video/BV1A7dNYAED5" : "https://youtu.be/gxUobykvNH4"} className="text-base text-gray-500 hover:text-gray-900">
                      {t('footer.getDemo')}
                    </Link>
                  </li>
                  <li>
                    <Link href={getLocalizedHref('/pricing')} className="text-base text-gray-500 hover:text-gray-900">
                      {t('footer.pricing')}
                    </Link>
                  </li>
                  <li>
                    <Link href={getLocalizedHref('/what-is-hami')} className="text-base text-gray-500 hover:text-gray-900">
                      {t('footer.poweredByHami')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right section (1/3 width) - Will contain images */}
          <div className="w-full md:w-1/3 mb-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="flex justify-center">
                <Image 
                  src="/images/cncfsandbox.png" 
                  alt="CNCF Sandbox" 
                  width={160}
                  height={64}
                  className="max-h-16 w-auto"
                />
              </div>
              <div className="flex justify-center">
                <Image 
                  src="/images/cnailandscape.png" 
                  alt="CN AI Landscape" 
                  width={160}
                  height={64}
                  className="max-h-16 w-auto" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Legal Links */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between">
          <p className="text-center text-base text-gray-400">{t('footer.copyright')}</p>
          <div className="mt-4 sm:mt-0 text-center sm:text-right">
            <Link href={getLocalizedHref('/privacy-policy')} className="text-sm text-gray-400 mr-4 hover:text-gray-500">
              {t('footer.privacyPolicy')}
            </Link>
            <Link href={getLocalizedHref('/cookies-policy')} className="text-sm text-gray-400 mr-4 hover:text-gray-500">
              {t('footer.cookiesPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 