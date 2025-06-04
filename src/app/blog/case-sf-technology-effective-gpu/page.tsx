'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Animation configurations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function SfTechnologyEffectiveGpuCasePage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-8">
                <div className="w-24 h-24 bg-white rounded-lg shadow-sm p-2 flex items-center justify-center">
                  <Image
                    src="/sf-tech.svg"
                    alt="SF Tech Logo"
                    width={80}
                    height={80}
                    className="w-full h-auto"
                  />
                </div>
                <div className="text-4xl text-gray-400">+</div>
                <div className="w-24 h-24 bg-white rounded-lg shadow-sm p-2 flex items-center justify-center">
                  <Image
                    src="/hami.svg"
                    alt="HAMi Logo"
                    width={80}
                    height={80}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
              {t('cases.sfTechnologyEffectiveGpu.title')}
            </h1>
            <p className="mt-4 text-xl text-gray-600 leading-relaxed">
              {t('cases.sfTechnologyEffectiveGpu.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Overview */}
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
                {t('cases.sfTechnologyEffectiveGpu.overview.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('cases.sfTechnologyEffectiveGpu.overview.description')}
              </p>
              <div className="space-y-4">
                {(function() {
                  const keyPoints = t('cases.sfTechnologyEffectiveGpu.overview.keyPoints', { returnObjects: true });
                  return Array.isArray(keyPoints) 
                    ? keyPoints
                    : ['领先的物流科技服务提供商', '广泛的 AI 和机器学习应用', '大规模 GPU 基础设施需求', '专注于成本优化和效率提升'];
                }()).map((point: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-[#0FD05D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-base text-gray-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-lg shadow-sm p-2 mx-auto mb-4 flex items-center justify-center">
                    <Image
                      src="/sf-tech.svg"
                      alt="SF Tech Logo"
                      width={80}
                      height={80}
                      className="w-full h-auto"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('cases.sfTechnologyEffectiveGpu.companyCard.name')}</h3>
                  <p className="text-gray-600 text-sm">{t('cases.sfTechnologyEffectiveGpu.companyCard.description')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Challenges */}
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
              {t('cases.sfTechnologyEffectiveGpu.challenge.title')}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {t('cases.sfTechnologyEffectiveGpu.challenge.description')}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {(function() {
              const challenges = t('cases.sfTechnologyEffectiveGpu.challenge.points', { returnObjects: true });
              return Array.isArray(challenges) 
                ? challenges
                : ['资源利用率低', '调度粒度粗', '异构适配困难', '影响 ROI'];
            }()).map((challenge: string, index: number) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-700 leading-relaxed">{challenge}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('cases.sfTechnologyEffectiveGpu.solution.title')}
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              {t('cases.sfTechnologyEffectiveGpu.solution.description')}
            </p>
            <p className="text-lg text-gray-700 font-medium">
              {t('cases.sfTechnologyEffectiveGpu.solution.objective')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(function() {
              const innovations = t('cases.sfTechnologyEffectiveGpu.solution.innovations', { returnObjects: true });
              return Array.isArray(innovations) 
                ? innovations
                : [
                    { title: 'GPU 池化与虚拟化', description: '将分散的 GPU 资源整合为统一的资源池' },
                    { title: '细粒度资源切分', description: '支持按核心利用率和显存容量进行精确切分' },
                    { title: '弹性资源超配', description: '引入双维度超分技术' },
                    { title: '统一管理与调度', description: '提供统一的调度接口' }
                  ];
            }()).map((innovation: any, index: number) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border border-green-100"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0FD05D] rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{innovation.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{innovation.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
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
              {t('cases.sfTechnologyEffectiveGpu.results.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('cases.sfTechnologyEffectiveGpu.results.description')}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {(function() {
              const resultItems = t('cases.sfTechnologyEffectiveGpu.results.items', { returnObjects: true });
              return Array.isArray(resultItems) 
                ? resultItems
                : [
                    { title: "大模型推理服务", value: "28 张卡 → 65 个服务", description: "节省 37 张卡" },
                    { title: "测试服务集群", value: "6 张卡 → 19 个服务", description: "节省 13 张卡" },
                    { title: "性能影响", value: "仅下降 0.5%", description: "添加池化层后的性能影响" }
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
                <p className="text-2xl font-bold text-[#0FD05D] my-4">{item.value}</p>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HAMi Integration */}
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
              {t('cases.sfTechnologyEffectiveGpu.hamiIntegration.title')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('cases.sfTechnologyEffectiveGpu.hamiIntegration.description')}
            </p>
          </motion.div>

          <div className="space-y-6">
            {(function() {
              const points = t('cases.sfTechnologyEffectiveGpu.hamiIntegration.points', { returnObjects: true });
              return Array.isArray(points) 
                ? points
                : ['深度集成了 HAMi 核心能力', '构建了统一的抽象驱动框架', '采用了兼容 HAMi 生态的设计'];
            }()).map((point: string, index: number) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-l-4 border-[#0FD05D]"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#0FD05D] rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Validation */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
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
              {t('cases.sfTechnologyEffectiveGpu.validation.title')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('cases.sfTechnologyEffectiveGpu.validation.description')}
            </p>
          </motion.div>

          <div className="space-y-6">
            {(function() {
              const points = t('cases.sfTechnologyEffectiveGpu.validation.points', { returnObjects: true });
              return Array.isArray(points) 
                ? points
                : ['证明 HAMi 关键能力', 'CNCF Sandbox 项目实践'];
            }()).map((point: string, index: number) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white p-6 rounded-lg shadow-md border border-green-200"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#0FD05D] rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-2xl border border-green-100">
              <svg className="w-12 h-12 text-[#0FD05D] mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
              </svg>
              <blockquote className="text-xl italic text-gray-700 mb-6">
                &ldquo;{t('cases.sfTechnologyEffectiveGpu.quote.text')}&rdquo;
              </blockquote>
              <div className="text-center">
                <div className="font-bold text-gray-900">{t('cases.sfTechnologyEffectiveGpu.quote.author')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Conclusion & CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-green-50">
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
              {t('cases.sfTechnologyEffectiveGpu.conclusion.title')}
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              {t('cases.sfTechnologyEffectiveGpu.conclusion.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/Project-HAMi/HAMi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0FD05D] hover:bg-[#0AB04D] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {t('cases.sfTechnologyEffectiveGpu.cta.exploreHami')}
              </a>
              <a
                href="mailto:info@dynamia.ai"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('cases.sfTechnologyEffectiveGpu.cta.contactUs')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
} 