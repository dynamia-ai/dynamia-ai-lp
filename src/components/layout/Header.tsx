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
import Image from 'next/image';
// 暂时注释Search组件导入
// import Search from '@/components/Search';

// 定义子菜单项类型
type SubmenuItem = {
  name: string;
  description: string;
  href: string;
  external: boolean;
  iconName: 'infoCircle' | 'globe' | 'code' | 'users' | 'document' | 'blog' | 'folder';
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
      href: 'https://github.com/Project-HAMi/HAMi?tab=readme-ov-file#meeting--contact',
      external: true,
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
    },
    { 
      name: t('navigation.adopters'), 
      description: t('navigation.adoptersDesc'),
      href: 'https://project-hami.io/adopters', 
      external: true,
      iconName: 'users'
    }
  ];

  // 解决方案子菜单
  const solutionsSubmenu: SubmenuItem[] = [
    {
      name: t('navigation.caseSfTechnology'),
      description: t('navigation.caseSfTechnologyDesc'),
      href: currentLocale === 'zh' ? '/zh/blog/case-sf-technology-effective-gpu' : '/blog/case-sf-technology-effective-gpu',
      external: false,
      iconName: 'document'
    },
    { 
      name: t('navigation.caseTelecom'), 
      description: t('navigation.caseTelecomDesc'),
      href: currentLocale === 'zh' ? '/zh/blog/case-telecom-gpu' : '/blog/case-telecom-gpu', 
      external: false,
      iconName: 'document'
    },
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
                  <Link href={currentLocale === 'zh' ? '/zh' : '/'}>
                    <Image
                      src="/LOGO.svg"
                      alt="Dynamia AI Logo"
                      width={160}
                      height={40}
                      priority
                    />
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
                          // 调整字体大小
                          className={`inline-flex items-center px-1 h-full border-b-2 text-base font-medium ${
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
                            className="fixed left-0 right-0 top-16 bg-white shadow-lg z-50 fadeIn"
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
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <div className="flex">
                                {/* Left side - Large title */}
                                <div className="w-1/3 pr-10 sm:pl-45">
                                  <div className={`dropdown-description ${
                                    item.submenuType === 'hami'
                                      ? 'bg-hami-pattern'
                                      : item.submenuType === 'resources'
                                        ? 'bg-resources-pattern'
                                        : ''
                                  }`}>
                                    <div className="dropdown-title text-3xl font-bold text-gray-900 pt-0 mt-0">
                                      {item.name}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Right side - Menu items with dividers */}
                                <div className="w-2/3 border-l border-gray-200 pl-10">
                                  <ul className="grid grid-cols-2 gap-4">
                                    {(
                                      item.submenuType === 'hami' 
                                        ? hamiSubmenu 
                                        : item.submenuType === 'resources' 
                                          ? resourcesSubmenu 
                                          : solutionsSubmenu
                                    ).map((subItem) => (
                                      <li 
                                        key={subItem.name}
                                        className="menu-item"
                                      >
                                        {subItem.external ? (
                                          <a
                                            href={subItem.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block hover:bg-primary-lighter p-4 rounded-md transition-colors duration-150"
                                          >
                                            <div className="menu-item__title font-medium text-gray-900 mb-1">
                                              {subItem.name}
                                            </div>
                                            <span className="d-flex justify-content-between">
                                              <div className="menu-item__text text-gray-500 text-sm">
                                                <p>{subItem.description}</p>
                                              </div>
                                            </span>
                                          </a>
                                        ) : (
                                          <Link
                                            href={subItem.href}
                                            className="block hover:bg-primary-lighter p-4 rounded-md transition-colors duration-150"
                                          >
                                            <div className="menu-item__title font-medium text-gray-900 mb-1">
                                              {subItem.name}
                                            </div>
                                            <span className="d-flex justify-content-between">
                                              <div className="menu-item__text text-gray-500 text-sm">
                                                <p>{subItem.description}</p>
                                              </div>
                                            </span>
                                          </Link>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex items-center h-full px-1 border-b-2 text-base font-medium ${
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
                  href={currentLocale === 'zh' ? '/zh/apply-trial' : '/apply-trial'}
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
                  className="inline-flex items-center px-2 py-1 text-l font-medium text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-5 w-5 inline-block mb-1 lg:mr-2 lg:mt-[2px]" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M87.956 73.232C92.2458 66.2434 94.5112 58.2012 94.5 50.001C94.5113 41.8006 92.2459 33.7569 87.956 26.768L87.932 26.729C83.9522 20.2422 78.3754 14.8845 71.7345 11.1676C65.0935 7.45081 57.6103 5.49915 50 5.49915C42.3897 5.49915 34.9065 7.45081 28.2656 11.1676C21.6246 14.8845 16.0478 20.2422 12.068 26.729L12.044 26.768C7.76491 33.7616 5.50049 41.8012 5.50049 50C5.50049 58.1989 7.76491 66.2384 12.044 73.232L12.069 73.272C16.0489 79.7585 21.6258 85.116 28.2667 88.8326C34.9076 92.5492 42.3906 94.5007 50.0008 94.5006C57.6109 94.5005 65.0939 92.5488 71.7347 88.8321C78.3755 85.1153 83.9523 79.7576 87.932 73.271L87.956 73.232ZM55.688 86.873C54.8399 87.6914 53.8637 88.3656 52.798 88.869C51.9236 89.2845 50.9676 89.5001 49.9995 89.5001C49.0314 89.5001 48.0754 89.2845 47.201 88.869C45.1736 87.8335 43.438 86.3063 42.153 84.427C39.5288 80.6346 37.5842 76.4148 36.406 71.956C40.9327 71.6774 45.464 71.5354 50 71.53C54.534 71.53 59.0657 71.672 63.595 71.956C62.9427 74.2484 62.128 76.4914 61.157 78.668C59.8784 81.7292 58.0215 84.515 55.688 86.873ZM10.587 52.5H28.536C28.653 57.5084 29.1959 62.4977 30.159 67.414C25.2523 67.846 20.3583 68.4394 15.477 69.194C12.6183 64.0654 10.9472 58.3605 10.587 52.5ZM15.477 30.807C20.3563 31.563 25.252 32.1564 30.164 32.587C29.1992 37.5028 28.6553 42.4919 28.538 47.5H10.587C10.9473 41.6399 12.6184 35.9353 15.477 30.807ZM44.312 13.127C45.1601 12.3086 46.1363 11.6344 47.202 11.131C48.0764 10.7156 49.0324 10.5 50.0005 10.5C50.9686 10.5 51.9246 10.7156 52.799 11.131C54.8264 12.1666 56.562 13.6938 57.847 15.573C60.4712 19.3654 62.4158 23.5853 63.594 28.044C59.0673 28.3227 54.536 28.4647 50 28.47C45.466 28.47 40.9343 28.328 36.405 28.044C37.0573 25.7516 37.872 23.5086 38.843 21.332C40.1216 18.2709 41.9785 15.485 44.312 13.127ZM89.413 47.5H71.464C71.347 42.4917 70.8041 37.5023 69.841 32.586C74.7477 32.154 79.6417 31.5607 84.523 30.806C87.3818 35.9346 89.0528 41.6395 89.413 47.5ZM35.188 67.025C34.2103 62.2416 33.6582 57.3809 33.538 52.5H66.463C66.344 57.3812 65.7929 62.2422 64.816 67.026C59.8827 66.702 54.944 66.5367 50 66.53C45.06 66.53 40.1227 66.695 35.188 67.025ZM64.812 32.975C65.7897 37.7585 66.3418 42.6192 66.462 47.5H33.538C33.657 42.6189 34.2082 37.7579 35.185 32.974C40.1183 33.298 45.057 33.4634 50.001 33.47C54.941 33.47 59.8783 33.3047 64.813 32.974L64.812 32.975ZM71.462 52.5H89.413C89.0527 58.3602 87.3816 64.0647 84.523 69.193C79.643 68.437 74.7473 67.8437 69.836 67.413C70.8008 62.4973 71.3448 57.5082 71.462 52.5ZM81.525 26.205C77.2583 26.8204 72.9793 27.3077 68.688 27.667C67.9168 24.7951 66.9221 21.9878 65.713 19.271C64.6089 16.7711 63.2197 14.4071 61.573 12.226C69.5306 14.6667 76.5137 19.5592 81.525 26.205ZM22.07 22.069C26.6349 17.4997 32.251 14.12 38.426 12.226C38.332 12.348 38.236 12.464 38.144 12.587C34.97 17.1559 32.658 22.2666 31.322 27.667C27.03 27.3037 22.748 26.8164 18.476 26.205C19.5776 24.7455 20.7785 23.3636 22.07 22.069ZM18.476 73.795C22.742 73.1797 27.021 72.6924 31.313 72.333C32.0842 75.205 33.0789 78.0122 34.288 80.729C35.3921 83.229 36.7813 85.593 38.428 87.774C30.4704 85.3334 23.4874 80.4408 18.476 73.795ZM77.932 77.931C73.3671 82.5004 67.751 85.8801 61.576 87.774C61.67 87.652 61.766 87.536 61.858 87.413C65.032 82.8441 67.344 77.7334 68.68 72.333C72.972 72.6964 77.254 73.1837 81.526 73.795C80.4244 75.2546 79.2235 76.6365 77.932 77.931Z" fill="black"/>
                  </svg>
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
                    href={currentLocale === 'zh' ? '/zh/apply-trial' : '/apply-trial'}
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                    </svg>
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