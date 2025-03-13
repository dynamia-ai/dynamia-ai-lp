'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Search from '@/components/Search';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  
  // 确定当前语言
  const currentLocale = pathname?.startsWith('/zh') ? 'zh' : 'en';

  // 切换语言
  const changeLanguage = (newLocale: string) => {
    // 获取当前路径和语言
    const currentPath = pathname || '/';
    
    if (newLocale === currentLocale) return;
    
    // 设置Cookie，持久化语言选择
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 一年有效期
    
    let newPath;
    if (newLocale === 'en') {
      // 从 /zh/... 切换到 /...（英文为默认语言，使用根路径而不是/en）
      if (currentPath === '/zh') {
        newPath = '/';
      } else if (currentPath.startsWith('/zh/')) {
        newPath = currentPath.replace(/^\/zh\//, '/');
      } else {
        newPath = currentPath.replace(/^\/zh/, '');
      }
    } else {
      // 从 /... 切换到 /zh/...
      if (currentPath === '/') {
        newPath = '/zh';
      } else if (currentPath.startsWith('/')) {
        newPath = `/zh${currentPath}`;
      } else {
        newPath = `/zh/${currentPath}`;
      }
    }
    
    // 使用window.location直接跳转，绕过Next.js的客户端路由
    if (newPath !== currentPath) {
      // 构建完整的URL
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${newPath}`;
      
      // 直接修改地址
      window.location.href = fullUrl;
    }
  };

  // 导航链接
  const navigation = [
    { name: t('navigation.home'), href: currentLocale === 'zh' ? '/zh' : '/' },
    { name: t('navigation.products'), href: currentLocale === 'zh' ? '/zh/products' : '/products' },
    { name: t('navigation.solutions'), href: currentLocale === 'zh' ? '/zh/solutions' : '/solutions' },
    { name: t('navigation.resources'), href: currentLocale === 'zh' ? '/zh/resources' : '/resources' },
    { name: t('navigation.company'), href: currentLocale === 'zh' ? '/zh/company' : '/company' },
  ];

  return (
    <Disclosure as="nav" className="bg-white shadow-sm sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href={currentLocale === 'zh' ? '/zh' : '/'} className="text-2xl font-bold text-primary">
                    Dynamia AI
                  </Link>
                </div>
                <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        pathname === item.href || (pathname === '/' && item.href === '/') || (pathname === '/zh' && item.href === '/zh')
                          ? 'border-primary text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                <Search />
                
                <Link
                  href={currentLocale === 'zh' ? '/zh/free-trial' : '/free-trial'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                >
                  {t('navigation.freeTrial')}
                </Link>
                <Link
                  href={currentLocale === 'zh' ? '/zh/request-demo' : '/request-demo'}
                  className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary bg-white hover:bg-gray-50"
                >
                  {t('navigation.requestDemo')}
                </Link>
                <button
                  onClick={() => changeLanguage(currentLocale === 'zh' ? 'en' : 'zh')}
                  className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {currentLocale === 'zh' ? 'English' : '中文'}
                </button>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                  <span className="sr-only">{t('navigation.openMenu')}</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === item.href
                      ? 'border-primary text-primary bg-primary-lighter'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              <div className="px-4 py-2">
                <Search />
              </div>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="space-y-1">
                  <Link
                    href={currentLocale === 'zh' ? '/zh/free-trial' : '/free-trial'}
                    className="block px-4 py-2 text-base font-medium text-primary hover:bg-gray-100"
                  >
                    {t('navigation.freeTrial')}
                  </Link>
                  <Link
                    href={currentLocale === 'zh' ? '/zh/request-demo' : '/request-demo'}
                    className="block px-4 py-2 text-base font-medium text-primary hover:bg-gray-100"
                  >
                    {t('navigation.requestDemo')}
                  </Link>
                  <button
                    onClick={() => changeLanguage(currentLocale === 'zh' ? 'en' : 'zh')}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    {currentLocale === 'zh' ? 'English' : '中文'}
                  </button>
                </div>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Header; 