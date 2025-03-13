"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';

export default function RequestDemo() {
  const { t } = useTranslation();
  
  // 获取演示内容并确保类型安全
  const demoItemsFromTranslation = t('requestDemo.demoContent.items', { returnObjects: true });
  const demoItems: string[] = Array.isArray(demoItemsFromTranslation)
    ? demoItemsFromTranslation
    : [
        "Overview of kantaloupe platform features",
        "Customized demonstration tailored to your needs",
        "Interactive session with our solution experts",
        "Detailed exploration of deployment options and pricing"
      ];

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {t('requestDemo.title')}
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                {t('requestDemo.subtitle')}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="bg-primary-lighter rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('requestDemo.demoContent.title')}</h2>
                <ul className="space-y-4">
                  {demoItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('requestDemo.form.title')}</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.name')}</label>
                    <input type="text" id="name" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.email')}</label>
                    <input type="email" id="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.company')}</label>
                    <input type="text" id="company" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.jobTitle')}</label>
                    <input type="text" id="jobTitle" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.message')}</label>
                    <textarea id="message" rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"></textarea>
                  </div>
                  <div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      {t('requestDemo.form.submitButton')}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-500">
                {t('requestDemo.followUp')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 