"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import FeatureComparisonTable from '@/components/FeatureComparisonTable';
import Image from 'next/image';

export default function Products() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('products.kantaloupe.title')}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('products.kantaloupe.subtitle')}
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('products.kantaloupe.title')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('products.kantaloupe.description')}
                </p>
                <div className="space-y-4">
                  {(
                    function() {
                      const features = t('products.kantaloupe.features', { returnObjects: true });
                      return Array.isArray(features) 
                        ? features 
                        : ['智能工作负载调度', '实时资源监控', '自动化扩展和优化', '跨平台兼容性', '企业级安全'];
                    }()
                  ).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-600">{feature}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/free-trial"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors"
                  >
                    {t('navigation.freeTrial')}
                  </Link>
                  <Link
                    href="/request-demo"
                    className="inline-flex items-center px-6 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 transition-colors"
                  >
                    {t('navigation.requestDemo')}
                  </Link>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-48 h-48 bg-primary-light rounded-lg mx-auto flex items-center justify-center">
                    <span className="text-primary font-bold text-xl">kantaloupe</span>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">Product Screenshot</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              {t('products.kantaloupe.technicalArchitecture')}
            </h2>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <div className="w-full max-w-3xl bg-white rounded border border-gray-200 flex items-center justify-center p-4 relative h-64">
                <Image 
                  src="/images/products/architecture-diagram.png" 
                  alt={t('products.kantaloupe.architectureDiagram')} 
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            </div>
          </div>

          <FeatureComparisonTable />

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('products.kantaloupe.readyToStart')}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/free-trial"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                {t('navigation.freeTrial')}
              </Link>
              <Link
                href="/request-demo"
                className="inline-flex items-center px-6 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 transition-colors"
              >
                {t('navigation.requestDemo')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 