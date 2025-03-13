"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';

export default function FreeTrial() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('freeTrial.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              {t('freeTrial.subtitle')}
            </p>
          </div>

          <div className="mt-12 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.name')}</label>
                <input type="text" id="name" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.email')}</label>
                <input type="email" id="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.company')}</label>
                <input type="text" id="company" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.phone')}</label>
                <input type="tel" id="phone" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.useCase')}</label>
                <textarea id="useCase" rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"></textarea>
              </div>
              <div className="flex items-start">
                <input id="terms" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-500">
                  {t('freeTrial.form.terms')}
                </label>
              </div>
              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  {t('freeTrial.form.submitButton')}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>{t('freeTrial.disclaimer')}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 