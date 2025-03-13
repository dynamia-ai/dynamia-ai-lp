'use client';
/**
 * 重要说明：i18n只能在客户端组件中使用 
 * 1. 确保所有使用useTranslation()的组件都添加'use client'指令
 * 2. 不要在服务器组件中导入i18next或react-i18next
 * 3. 在出现i18n相关错误时检查组件是否正确标记为客户端组件
 */

import React, { ReactNode, useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { usePathname } from 'next/navigation';

// 导入翻译文件
import enTranslation from '../i18n/locales/en.json';
import zhTranslation from '../i18n/locales/zh.json';

// 初始化配置
const initI18n = () => {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslation,
        },
        zh: {
          translation: zhTranslation,
        },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false, // 禁用Suspense
      }
    });
  return i18n;
};

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const pathname = usePathname();
  const [loaded, setLoaded] = useState(false);
  
  // 确保只在客户端初始化
  useEffect(() => {
    // 防止重复初始化
    if (!i18n.isInitialized) {
      const i18nInstance = initI18n();
      
      // 根据路径设置语言
      if (pathname?.startsWith('/zh')) {
        i18nInstance.changeLanguage('zh');
      } else {
        i18nInstance.changeLanguage('en');
      }
    } else {
      // 已经初始化，只更新语言
      if (pathname?.startsWith('/zh')) {
        i18n.changeLanguage('zh');
      } else {
        i18n.changeLanguage('en');
      }
    }
    
    setLoaded(true);
  }, [pathname]);

  // 等待i18n加载完成
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-b-2 border-primary mb-4 transform-gpu" style={{ transformOrigin: 'center' }}></div>
          <div className="text-primary text-lg flex items-center">
            <span>Loading</span>
            <span className="ml-1 inline-block animate-pulse">.</span>
            <span className="inline-block animate-pulse animation-delay-200">.</span>
            <span className="inline-block animate-pulse animation-delay-400">.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
} 