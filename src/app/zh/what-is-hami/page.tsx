'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// 特性图标映射
const featureIcons = [
  'kubernetes-compatibility',
  'open-neutral',
  'vendor-lock',
  'resource-isolation',
  'heterogeneous-devices',
  'unified-management'
];

// 特性接口定义
interface Feature {
  title: string;
  description: string;
}

export default function HamiPage() {
  const { t } = useTranslation();

  // 使用翻译数据
  const features = t('hamiPage.features', { returnObjects: true }) as Feature[];

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
              {t('hamiPage.title')} <span className="text-primary">HAMi</span>？
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              {t('hamiPage.introduction')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 主要介绍区域 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              {t('hamiPage.solutionTitle')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('hamiPage.solutionDesc')}
            </p>
          </motion.div>

          {/* 核心特性列表 */}
          <div className="space-y-20">
            {Array.isArray(features) && features.map((feature: Feature, index: number) => (
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
                  <div className="w-60 h-60 bg-primary-light rounded-full flex items-center justify-center p-4">
                    <Image
                      src={`/icons/${featureIcons[index]}.svg`}
                      alt={feature.title}
                      width={160}
                      height={160}
                      className="object-contain"
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
              {t('hamiPage.ctaTitle')}
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              {t('hamiPage.ctaDesc')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="https://github.com/Project-HAMi/HAMi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                {t('hamiPage.githubButton')}
              </a>
              <a
                href="https://project-hami.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50"
              >
                {t('hamiPage.websiteButton')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
} 