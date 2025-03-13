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
  'scheduler',
  'monitoring',
  'autoscaling',
  'multi-cluster',
  'security',
  'support'
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
          title: '高级调度引擎', 
          description: '智能工作负载分配与队列管理，确保资源高效利用并减少等待时间。'
        },
        { 
          title: '实时监控与分析', 
          description: '全方位监控系统性能，提供深入洞察和趋势分析，帮助您优化资源配置和成本。'
        },
        { 
          title: '自动扩展与优化', 
          description: '根据工作负载需求自动调整资源分配，优化资源使用效率并降低成本。'
        },
        { 
          title: '多集群管理', 
          description: '统一管理多个计算集群，提供一致的跨集群资源分配和工作负载调度。'
        },
        { 
          title: '企业级安全保障', 
          description: '全面的安全解决方案，包括身份验证、授权、加密和审计日志。'
        },
        { 
          title: '企业级支持与服务', 
          description: '专业的技术支持团队，提供全天候响应和定期维护服务。'
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
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
                      : ['基于HAMi开源核心', '企业级功能增强', '专业技术支持', '持续更新与维护'];
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
              <div className="w-full max-w-md bg-primary-light rounded-lg overflow-hidden p-0">
                <div className="p-2 flex items-center justify-center">
                  <Image 
                    src="/images/products/product-overview.png" 
                    alt="Kantaloupe Overview" 
                    width={550}
                    height={550}
                    className="rounded-lg"
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 技术架构区域 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('products.kantaloupe.technicalArchitecture')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('products.kantaloupe.architectureDescription')}
            </p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden p-0">
              <div className="p-2 flex items-center justify-center">
                <Image 
                  src="/images/products/architecture-diagram.png" 
                  alt={t('products.kantaloupe.architectureDiagram')} 
                  width={900}
                  height={500}
                  className="rounded-lg"
                  style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 商业特性区域 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('products.kantaloupe.commercialFeatures.title')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('products.kantaloupe.commercialFeatures.subtitle')}
            </p>
          </motion.div>

          {/* 核心特性列表 */}
          <div className="space-y-20">
            {features.map((feature: Feature, index: number) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-8 lg:gap-16`}
              >
                <div className="w-full lg:w-1/2 flex justify-center">
                  <div className="w-60 h-60 bg-primary-light rounded-full flex items-center justify-center p-3">
                    <Image
                      src={`/images/products/${featureIcons[index]}.svg`}
                      alt={feature.title}
                      width={150}
                      height={150}
                      className="rounded-lg"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="bg-primary-light py-16">
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