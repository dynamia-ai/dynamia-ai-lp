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
import ExternalLinkIcon from '@/components/ExternalLinkIcon';
// 暂时注释Search组件导入
// import Search from '@/components/Search';

// 定义子菜单项类型
type SubmenuItem = {
  name: string;
  description: string;
  href: string;
  external: boolean;
  iconName: 'infoCircle' | 'globe' | 'code' | 'users' | 'document' | 'blog';
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
    { name: t('navigation.hami'), href: '#', hasSubmenu: true, submenuType: 'hami' },
    { name: t('navigation.products'), href: currentLocale === 'zh' ? '/zh/products' : '/products' },
    { name: t('navigation.solutions'), href: '#', hasSubmenu: true, submenuType: 'solutions' },
    { name: t('navigation.pricing'), href: currentLocale === 'zh' ? '/zh/pricing' : '/pricing' },
    { name: t('navigation.resources'), href: '#', hasSubmenu: true, submenuType: 'resources' },
    { name: t('navigation.company'), href: currentLocale === 'zh' ? '/zh/company' : '/company' },
  ];

  // HAMi子菜单
  const hamiSubmenu: SubmenuItem[] = [
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

  // 资源子菜单
  const resourcesSubmenu: SubmenuItem[] = [
    { 
      name: t('navigation.resourcesDoc'), 
      description: t('navigation.resourcesDocDesc'),
      href: 'https://project-hami.io/docs/', 
      external: true,
      iconName: 'document'
    },
    { 
      name: t('navigation.resourcesBlog'), 
      description: t('navigation.resourcesBlogDesc'),
      href: 'https://project-hami.io/blog', 
      external: true,
      iconName: 'blog'
    }
  ];

  // 解决方案子菜单
  const solutionsSubmenu: SubmenuItem[] = [
    { 
      name: t('navigation.caseTelecom'), 
      description: t('navigation.caseTelecomDesc'),
      href: currentLocale === 'zh' ? '/zh/blog/case-telecom-gpu' : '/blog/case-telecom-gpu', 
      external: false,
      iconName: 'document'
    }
  ];

  // 控制下拉菜单的状态
  const [isHamiMenuOpen, setIsHamiMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  const hamiMenuRef = useRef<HTMLDivElement>(null);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);
  const hamiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resourcesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const solutionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearHamiCloseTimeout = () => {
    if (hamiTimeoutRef.current) {
      clearTimeout(hamiTimeoutRef.current);
      hamiTimeoutRef.current = null;
    }
  };
  
  const clearResourcesCloseTimeout = () => {
    if (resourcesTimeoutRef.current) {
      clearTimeout(resourcesTimeoutRef.current);
      resourcesTimeoutRef.current = null;
    }
  };
  
  const clearSolutionsCloseTimeout = () => {
    if (solutionsTimeoutRef.current) {
      clearTimeout(solutionsTimeoutRef.current);
      solutionsTimeoutRef.current = null;
    }
  };
  
  // 打开HAMi菜单
  const handleHamiMouseEnter = () => {
    clearHamiCloseTimeout();
    setIsHamiMenuOpen(true);
  };
  
  // 延迟关闭HAMi菜单
  const handleHamiMouseLeave = () => {
    clearHamiCloseTimeout();
    hamiTimeoutRef.current = setTimeout(() => {
      setIsHamiMenuOpen(false);
    }, 300); // 300ms延迟，给用户足够时间移动到下拉菜单
  };

  // 打开资源菜单
  const handleResourcesMouseEnter = () => {
    clearResourcesCloseTimeout();
    setIsResourcesMenuOpen(true);
  };
  
  // 延迟关闭资源菜单
  const handleResourcesMouseLeave = () => {
    clearResourcesCloseTimeout();
    resourcesTimeoutRef.current = setTimeout(() => {
      setIsResourcesMenuOpen(false);
    }, 300); // 300ms延迟，给用户足够时间移动到下拉菜单
  };

  // 打开解决方案菜单
  const handleSolutionsMouseEnter = () => {
    clearSolutionsCloseTimeout();
    setIsSolutionsMenuOpen(true);
  };
  
  // 延迟关闭解决方案菜单
  const handleSolutionsMouseLeave = () => {
    clearSolutionsCloseTimeout();
    solutionsTimeoutRef.current = setTimeout(() => {
      setIsSolutionsMenuOpen(false);
    }, 300);
  };
  
  // 清除超时器
  useEffect(() => {
    return () => {
      clearHamiCloseTimeout();
      clearResourcesCloseTimeout();
      clearSolutionsCloseTimeout();
    };
  }, []);
  
  // 处理点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (hamiMenuRef.current && !hamiMenuRef.current.contains(event.target as Node)) {
        setIsHamiMenuOpen(false);
      }
      if (resourcesMenuRef.current && !resourcesMenuRef.current.contains(event.target as Node)) {
        setIsResourcesMenuOpen(false);
      }
      if (solutionsMenuRef.current && !solutionsMenuRef.current.contains(event.target as Node)) {
        setIsSolutionsMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hamiMenuRef, resourcesMenuRef, solutionsMenuRef]);

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
                        ref={
                          item.submenuType === 'hami' 
                            ? hamiMenuRef 
                            : item.submenuType === 'resources' 
                              ? resourcesMenuRef 
                              : solutionsMenuRef
                        }
                        className="relative flex items-center h-full"
                      >
                        <div
                          className={`inline-flex items-center px-1 h-full border-b-2 text-sm font-medium ${
                            (item.submenuType === 'hami' && isHamiMenuOpen) || 
                            (item.submenuType === 'resources' && isResourcesMenuOpen) ||
                            (item.submenuType === 'solutions' && isSolutionsMenuOpen)
                              ? 'border-primary text-gray-900'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                          onMouseEnter={
                            item.submenuType === 'hami' 
                              ? handleHamiMouseEnter 
                              : item.submenuType === 'resources' 
                                ? handleResourcesMouseEnter 
                                : handleSolutionsMouseEnter
                          }
                          onMouseLeave={
                            item.submenuType === 'hami' 
                              ? handleHamiMouseLeave 
                              : item.submenuType === 'resources' 
                                ? handleResourcesMouseLeave 
                                : handleSolutionsMouseLeave
                          }
                        >
                          {item.name}
                          <ChevronDownIcon 
                            className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                              (item.submenuType === 'hami' && isHamiMenuOpen) || 
                              (item.submenuType === 'resources' && isResourcesMenuOpen) ||
                              (item.submenuType === 'solutions' && isSolutionsMenuOpen) 
                                ? 'transform rotate-180' : ''
                            }`} 
                          />
                        </div>
                        
                        {((item.submenuType === 'hami' && isHamiMenuOpen) || 
                          (item.submenuType === 'resources' && isResourcesMenuOpen) ||
                          (item.submenuType === 'solutions' && isSolutionsMenuOpen)) && (
                          <div 
                            className={`absolute left-0 top-full mt-1 ${item.submenuType === 'solutions' ? 'w-[325px]' : 'w-[650px]'} rounded-lg shadow-lg bg-white ring-1 hami-menu-border z-50 fadeIn`}
                            onMouseEnter={
                              item.submenuType === 'hami' 
                                ? handleHamiMouseEnter 
                                : item.submenuType === 'resources' 
                                  ? handleResourcesMouseEnter 
                                  : handleSolutionsMouseEnter
                            }
                            onMouseLeave={
                              item.submenuType === 'hami' 
                                ? handleHamiMouseLeave 
                                : item.submenuType === 'resources' 
                                  ? handleResourcesMouseLeave 
                                  : handleSolutionsMouseLeave
                            }
                          >
                            <div className="p-4">
                              <div className={`grid ${item.submenuType === 'solutions' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                {(
                                  item.submenuType === 'hami' 
                                    ? hamiSubmenu 
                                    : item.submenuType === 'resources' 
                                      ? resourcesSubmenu 
                                      : solutionsSubmenu
                                ).map((subItem) => (
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
                                          <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                              <h3 className="text-base font-medium text-gray-900">{subItem.name}</h3>
                                              <ExternalLinkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                            </div>
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
                                          <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                              <h3 className="text-base font-medium text-gray-900">{subItem.name}</h3>
                                            </div>
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
                  <div key={item.name}>
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <ChevronDownIcon 
                                className={`h-5 w-5 transition-transform duration-200 ${
                                  open ? 'transform rotate-180' : ''
                                }`} 
                              />
                            </div>
                          </Disclosure.Button>
                          <Disclosure.Panel className="pl-6 space-y-1">
                            {(
                              item.submenuType === 'hami' 
                                ? hamiSubmenu 
                                : item.submenuType === 'resources' 
                                  ? resourcesSubmenu 
                                  : solutionsSubmenu
                            ).map((subItem) => (
                              <div key={subItem.name} className="p-3 rounded-md hover:bg-primary-lighter transition-colors duration-150">
                                {subItem.external ? (
                                  <a
                                    href={subItem.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-gray-500 hover:text-gray-900"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div className="mr-3">
                                          <HamiIcon iconName={subItem.iconName} className="h-5 w-5" />
                                        </div>
                                        <span>{subItem.name}</span>
                                      </div>
                                      <ExternalLinkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                    </div>
                                  </a>
                                ) : (
                                  <Link
                                    href={subItem.href}
                                    className="block text-gray-500 hover:text-gray-900"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div className="mr-3">
                                          <HamiIcon iconName={subItem.iconName} className="h-5 w-5" />
                                        </div>
                                        <span>{subItem.name}</span>
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
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium ${
                      pathname === item.href
                        ? 'text-primary-dark bg-primary-lighter'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="ml-3 space-y-2">
                  <Link
                    href={currentLocale === 'zh' ? '/zh/free-trial' : '/free-trial'}
                    className="block rounded-md px-4 py-2 text-base font-medium text-white bg-primary hover:bg-primary-dark text-center"
                  >
                    {t('navigation.freeTrial')}
                  </Link>
                  <Link
                    href={currentLocale === 'zh' ? '/zh/request-demo' : '/request-demo'}
                    className="block rounded-md px-4 py-2 text-base font-medium text-primary border border-primary hover:bg-gray-50 text-center"
                  >
                    {t('navigation.requestDemo')}
                  </Link>
                  <button
                    onClick={() => changeLanguage(currentLocale === 'zh' ? 'en' : 'zh')}
                    className="block rounded-md px-4 py-2 w-full text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-center"
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