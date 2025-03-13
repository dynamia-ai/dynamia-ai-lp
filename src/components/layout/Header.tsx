'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { Disclosure } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import HamiIcon from '@/components/HamiIcon';
// 暂时注释Search组件导入
// import Search from '@/components/Search';

// 定义子菜单项类型
type HamiSubmenuItem = {
  name: string;
  description: string;
  href: string;
  external: boolean;
  iconName: 'infoCircle' | 'globe' | 'code' | 'users';
}

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
    { name: t('navigation.hami'), href: '#', hasSubmenu: true },
    { name: t('navigation.products'), href: currentLocale === 'zh' ? '/zh/products' : '/products' },
    { name: t('navigation.solutions'), href: currentLocale === 'zh' ? '/zh/solutions' : '/solutions' },
    { name: t('navigation.resources'), href: currentLocale === 'zh' ? '/zh/resources' : '/resources' },
    { name: t('navigation.company'), href: currentLocale === 'zh' ? '/zh/company' : '/company' },
  ];

  // HAMi子菜单
  const hamiSubmenu: HamiSubmenuItem[] = [
    { 
      name: t('navigation.whatIsHami'), 
      description: t('navigation.whatIsHamiDesc'),
      href: currentLocale === 'zh' ? '/zh/what-is-hami' : '/what-is-hami', 
      external: false,
      iconName: 'infoCircle'
    },
    { 
      name: t('navigation.hamiWebsite'), 
      description: t('navigation.hamiWebsiteDesc'),
      href: 'https://project-hami.io/', 
      external: true,
      iconName: 'globe'
    },
    { 
      name: t('navigation.hamiGithub'), 
      description: t('navigation.hamiGithubDesc'),
      href: 'https://github.com/Project-HAMi/HAMi', 
      external: true,
      iconName: 'code'
    },
    { 
      name: t('navigation.community'), 
      description: t('navigation.communityDesc'),
      href: currentLocale === 'zh' ? '/zh/blog/community' : '/blog/community', 
      external: false,
      iconName: 'users'
    },
  ];

  // 控制下拉菜单的状态
  const [isHamiMenuOpen, setIsHamiMenuOpen] = useState(false);
  const hamiMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // 打开菜单
  const handleMouseEnter = () => {
    clearCloseTimeout();
    setIsHamiMenuOpen(true);
  };
  
  // 延迟关闭菜单
  const handleMouseLeave = () => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsHamiMenuOpen(false);
    }, 300); // 300ms延迟，给用户足够时间移动到下拉菜单
  };
  
  // 清除超时器
  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);
  
  // 处理点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (hamiMenuRef.current && !hamiMenuRef.current.contains(event.target as Node)) {
        setIsHamiMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hamiMenuRef]);

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
                <div className="hidden sm:ml-12 sm:flex sm:h-16 sm:space-x-8">
                  {navigation.map((item) => (
                    item.hasSubmenu ? (
                      <div 
                        key={item.name} 
                        ref={hamiMenuRef}
                        className="relative flex items-center h-full"
                      >
                        <div
                          className={`inline-flex items-center px-1 h-full border-b-2 text-sm font-medium ${
                            isHamiMenuOpen
                              ? 'border-primary text-gray-900'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          {item.name}
                          <ChevronDownIcon 
                            className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                              isHamiMenuOpen ? 'transform rotate-180' : ''
                            }`} 
                          />
                        </div>
                        
                        {isHamiMenuOpen && (
                          <div 
                            className="absolute left-0 top-full mt-1 w-[650px] rounded-lg shadow-lg bg-white ring-1 hami-menu-border z-50 fadeIn"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="p-4">
                              <div className="grid grid-cols-2 gap-4">
                                {hamiSubmenu.map((subItem) => (
                                  <div 
                                    key={subItem.name} 
                                    className="p-3 rounded-md transition-colors duration-150 hami-menu-item"
                                  >
                                    {subItem.external ? (
                                      <a
                                        href={subItem.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0 mr-4">
                                            <HamiIcon iconName={subItem.iconName} />
                                          </div>
                                          <div>
                                            <h3 className="text-base font-medium text-gray-900">{subItem.name}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{subItem.description}</p>
                                          </div>
                                        </div>
                                      </a>
                                    ) : (
                                      <Link
                                        href={subItem.href}
                                        className="block"
                                      >
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0 mr-4">
                                            <HamiIcon iconName={subItem.iconName} />
                                          </div>
                                          <div>
                                            <h3 className="text-base font-medium text-gray-900">{subItem.name}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{subItem.description}</p>
                                          </div>
                                        </div>
                                      </Link>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex items-center h-full px-1 border-b-2 text-sm font-medium ${
                          pathname === item.href || (pathname === '/' && item.href === '/') || (pathname === '/zh' && item.href === '/zh')
                            ? 'border-primary text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                {/* 暂时隐藏搜索栏 */}
                {/* <Search /> */}
                
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
                <Disclosure.Button
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                >
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
                item.hasSubmenu ? (
                  <Disclosure key={item.name}>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="w-full flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-primary-lighter hover:border-primary hover:text-gray-700">
                          {item.name}
                          <ChevronDownIcon
                            className={`${open ? 'transform rotate-180' : ''} ml-auto h-5 w-5 transition-transform duration-200`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="pl-6 space-y-1">
                          {hamiSubmenu.map((subItem) => (
                            <div key={subItem.name} className="p-3 rounded-md hover:bg-primary-lighter transition-colors duration-150">
                              {subItem.external ? (
                                <a
                                  href={subItem.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-4">
                                      <HamiIcon iconName={subItem.iconName} />
                                    </div>
                                    <div>
                                      <h3 className="text-base font-medium text-gray-900">{subItem.name}</h3>
                                      <p className="mt-1 text-sm text-gray-500">{subItem.description}</p>
                                    </div>
                                  </div>
                                </a>
                              ) : (
                                <Link
                                  href={subItem.href}
                                  className="block"
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-4">
                                      <HamiIcon iconName={subItem.iconName} />
                                    </div>
                                    <div>
                                      <h3 className="text-base font-medium text-gray-900">{subItem.name}</h3>
                                      <p className="mt-1 text-sm text-gray-500">{subItem.description}</p>
                                    </div>
                                  </div>
                                </Link>
                              )}
                            </div>
                          ))}
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ) : (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      pathname === item.href
                        ? 'border-primary text-primary bg-primary-lighter'
                        : 'border-transparent text-gray-500 hover:bg-primary-lighter hover:border-primary hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Disclosure.Button>
                )
              ))}
              <div className="px-4 py-2">
                {/* 暂时隐藏搜索栏 */}
                {/* <Search /> */}
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