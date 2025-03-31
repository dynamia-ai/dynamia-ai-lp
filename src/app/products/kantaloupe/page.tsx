"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function KantaloupeProduct() {
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

          <div className="mt-16">
            <div className="bg-[#3867D6]/5 rounded-xl p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">产品概述</h2>
                  <p className="text-gray-600 mb-6">
                    {t('products.kantaloupe.description')}
                  </p>
                  <p className="text-gray-600">
                    Kantaloupe 是一个专为企业级异构计算环境设计的统一管理平台。它能够无缝整合各种计算资源，包括 CPU、GPU、NPU、DCU 和专用加速器，以优化工作负载分配和资源利用率。
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
                  <div className="w-full h-64 bg-[#3867D6]/10 rounded flex items-center justify-center">
                    <span className="text-[#3867D6] font-bold text-xl">kantaloupe UI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">核心功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(
                function() {
                  const features = t('products.kantaloupe.features', { returnObjects: true });
                  return Array.isArray(features) 
                    ? features 
                    : ['智能工作负载调度', '实时资源监控', '自动化扩展和优化', '跨平台兼容性', '企业级安全'];
                }()
              ).map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-[#3867D6]/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-[#3867D6] font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{feature}</h3>
                  <p className="text-gray-500">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">技术架构</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="w-full h-96 bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center max-w-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Kantaloupe 架构图</h3>
                  <p className="text-gray-600 mb-6">
                    Kantaloupe 采用分层架构设计，包括资源抽象层、调度引擎、策略管理器和用户接口层。
                  </p>
                  <div className="w-full h-40 bg-[#3867D6]/10 rounded flex items-center justify-center">
                    <span className="text-[#3867D6]">架构示意图</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              准备好开始使用 kantaloupe 了吗？
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/apply-trial"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#3867D6] hover:bg-[#2d56c2] transition-colors"
              >
                {t('navigation.freeTrial')}
              </Link>
              <Link
                href="/request-demo"
                className="inline-flex items-center px-6 py-3 border border-[#3867D6] text-base font-medium rounded-md text-[#3867D6] bg-white hover:bg-gray-50 transition-colors"
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