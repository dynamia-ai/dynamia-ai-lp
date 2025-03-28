"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// 商业特性图标映射
const featureIcons = [
  'feature1',
  'feature2',
  'feature3',
  'feature4',
  'feature5',
  'feature6'
];

// 特性接口定义
interface Feature {
  title: string;
  description: string;
}

export default function Products() {
  const { t } = useTranslation();

  // 使用翻译数据获取商业特性
  const commercialFeatures = t('products.kantaloupe.commercialFeatures.list', { returnObjects: true });
  const features = Array.isArray(commercialFeatures) 
    ? commercialFeatures 
    : [
        {
          title: 'Hetero multi-cluster',
          description: 'Dynamia.ai provides a centralized approach to managing AI infrastructure, ensuring optimal workload distribution across hybrid, multi-cloud, and on-premises environments.'
        },
        {
          title: 'GPU Sharing',
          description: 'Dynamia.ai dynamically consolidates and orchestrates GPU resources. By eliminating waste, maximizing resource utilization, enterprises achieve superior ROI, reduced operational costs, and faster scaling of AI initiatives.'
        },
        {
          title: 'GPU Oversubscription',
          description: 'Dynamia.ai supports seamlessly unify GPU and host memory to maximize the efficiency of co-located AI workloads.'
        },
        {
          title: 'Seamlessly Auto Scale',
          description: 'GPU on-demand auto-scaling, seamless VPA scaling for AI workloads without restarts during GPU consumption surges.'
        },
        {
          title: 'Centralized Observability for Complete AI insight',
          description: 'Its centralized observability unifies resources from cloud, on-premises, and hybrid environments, empowering enterprises with actionable insights, policy-driven governance, and fine-grained resource management for efficient and scalable AI operations. '
        },
        {
          title: 'Advanced AI Scheduling',
          description: 'Advanced AI Scheduling for different scenarios including numa-aware, binpack, spread. Reduce data communication cost, minimize fragments, optimize task performance.'
        }
      ];

  return (
    <MainLayout>
      {/* 页面标题区域 */}
      <section className="bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              {t('products.kantaloupe.title')}
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              {t('products.kantaloupe.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 产品概述区域 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('products.kantaloupe.overview.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('products.kantaloupe.overview.description')}
              </p>
              <div className="space-y-4">
                {(
                  function() {
                    const highlights = t('products.kantaloupe.overview.highlights', { returnObjects: true });
                    return Array.isArray(highlights) 
                      ? highlights 
                      : ['基于 HAMi 开源核心', '企业级功能增强', '专业技术支持', '持续更新与维护'];
                  }()
                ).map((highlight: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="ml-3 text-base text-gray-600">{highlight}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors"
                >
                  {t('products.kantaloupe.viewPricing')}
                </Link>
                <Link
                  href="/request-demo"
                  className="inline-flex items-center px-6 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 transition-colors"
                >
                  {t('navigation.requestDemo')}
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="w-full bg-primary-light rounded-lg overflow-hidden p-0">
                <div className="p-2 flex items-center justify-center">
                  <Image 
                    src="/images/products/product-overview.png" 
                    alt="Kantaloupe Overview" 
                    width={550}
                    height={550}
                    className="rounded-lg"
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                    quality={100}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 商业特性区域 */}
      <section className="py-20 pb-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('products.kantaloupe.commercialFeatures.title')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('products.kantaloupe.commercialFeatures.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* 核心特性列表 - 每个特性作为一行，背景交替 */}
        <div className="space-y-0">
          {features.map((feature: Feature, index: number) => (
            <div
              key={index}
              className={`w-full ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`py-16 ${index === features.length - 1 ? 'pb-8' : ''} container mx-auto px-4 sm:px-6 lg:px-8`}
              >
                <div className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center justify-center gap-1 lg:gap-8 w-full max-w-6xl mx-auto`}>
                  <div className="w-full lg:w-1/2 flex justify-center items-start lg:items-center py-8">
                    <div className="flex items-center justify-center p-2 bg-white rounded-xl shadow-lg">
                      <Image
                        src={`/images/features/${featureIcons[index]}.png`}
                        alt={feature.title}
                        width={450}
                        height={450}
                        className="rounded-lg"
                        style={{ objectFit: 'contain' }}
                        quality={100}
                      />
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex items-start lg:items-center px-6">
                    <div className="max-w-xl">
                      <h3 className="text-3xl font-bold text-gray-900 mb-5">{feature.title}</h3>
                      <p className="text-xl text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA区域 */}
      <section className="bg-primary-light py-16 mt-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('products.kantaloupe.readyToStart')}
            </h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {t('products.kantaloupe.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                {t('products.kantaloupe.viewPricing')}
              </Link>
              <Link
                href="/free-trial"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50"
              >
                {t('navigation.freeTrial')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
} 