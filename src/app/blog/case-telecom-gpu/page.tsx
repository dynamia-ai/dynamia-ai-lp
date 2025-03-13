'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function TelecomGpuCasePage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      {/* 案例标题区域 */}
      <section className="bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
              {t('cases.telecomGpu.title')}
            </h1>
            <p className="mt-4 text-xl text-gray-600 leading-relaxed">
              {t('cases.telecomGpu.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 案例概览 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('cases.telecomGpu.overview.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('cases.telecomGpu.overview.description')}
              </p>
              <div className="space-y-4">
                {(function() {
                  const keyPoints = t('cases.telecomGpu.overview.keyPoints', { returnObjects: true });
                  return Array.isArray(keyPoints) 
                    ? keyPoints
                    : ['大规模GPU资源池', '多租户隔离', '高性能与低延迟'];
                }()).map((point: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-base text-gray-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/cases/telecom-gpu-overview.svg"
                alt="Telecom GPU Virtualization"
                width={540}
                height={360}
                className="rounded-lg shadow-lg object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 挑战与解决方案 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('cases.telecomGpu.challenge.title')}
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* 挑战 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('cases.telecomGpu.challenge.subtitle')}
              </h3>
              <ul className="space-y-4 text-gray-600">
                {(function() {
                  const challenges = t('cases.telecomGpu.challenge.points', { returnObjects: true });
                  return Array.isArray(challenges) 
                    ? challenges
                    : ['GPU资源分配不均衡', '虚拟化开销影响性能', '缺乏多租户隔离机制'];
                }()).map((challenge: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 text-red-500 mr-2">&#8226;</div>
                    <p>{challenge}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* 解决方案 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('cases.telecomGpu.solution.subtitle')}
              </h3>
              <ul className="space-y-4 text-gray-600">
                {(function() {
                  const solutions = t('cases.telecomGpu.solution.points', { returnObjects: true });
                  return Array.isArray(solutions) 
                    ? solutions
                    : ['实现GPU资源动态分配', '使用直通技术降低开销', '提供强隔离性的多租户环境'];
                }()).map((solution: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 text-green-500 mr-2">&#8226;</div>
                    <p>{solution}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 架构图 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('cases.telecomGpu.architecture.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('cases.telecomGpu.architecture.description')}
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
            <Image
              src="/images/cases/telecom-gpu-architecture.svg"
              alt="Architecture Diagram"
              width={900}
              height={500}
              className="rounded-lg shadow-lg object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* 实施成果 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('cases.telecomGpu.results.title')}
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 成果卡片 */}
            {(function() {
              const resultItems = t('cases.telecomGpu.results.items', { returnObjects: true });
              return Array.isArray(resultItems) 
                ? resultItems
                : [
                    {
                      title: "资源利用率提升",
                      value: "80%",
                      description: "GPU资源利用率显著提高"
                    },
                    {
                      title: "运营成本降低",
                      value: "40%",
                      description: "硬件成本与运营开销大幅减少"
                    },
                    {
                      title: "服务响应时间",
                      value: "90%",
                      description: "服务部署与响应时间显著缩短"
                    }
                  ];
            }()).map((item: any, index: number) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white p-6 rounded-lg shadow-md text-center"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-4xl font-bold text-primary my-4">{item.value}</p>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section className="py-16 bg-primary-light">
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
              {t('cases.telecomGpu.cta.title')}
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              {t('cases.telecomGpu.cta.description')}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
            >
              {t('cases.telecomGpu.cta.button')}
            </a>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
} 