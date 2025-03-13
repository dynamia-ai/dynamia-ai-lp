"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import GitHubStars from '@/components/GitHubStars';
import Image from 'next/image';

// 首页图标组件
const FeatureIcon: React.FC<{ icon: string }> = ({ icon }) => (
  <div className="rounded-md bg-primary-light p-3 inline-flex items-center justify-center">
    <svg
      className="h-6 w-6 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
  </div>
);

// 特性图标路径
const icons = {
  scheduling: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  multiCluster: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  gpu: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  cost: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
};

// 动画变体
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// 假设您有一个logo数组
const partnerLogos = [
  { name: 'company1', src: '/logos/company1.svg' },
  { name: 'company2', src: '/logos/company2.png' },
  { name: 'company3', src: '/logos/company3.svg' },
  { name: 'company4', src: '/logos/company4.svg' },
  { name: 'company5', src: '/logos/company5.svg' },
  { name: 'company6', src: '/logos/company6.png' },
];

export default function Home() {
  const { t } = useTranslation();

  const advantages = t('home.keyAdvantages.advantages', { returnObjects: true });
  const advantagesArray = Array.isArray(advantages) 
    ? advantages 
    : [
        { title: "高性能调度", description: "通过智能工作负载调度优化资源分配" },
        { title: "多集群编排", description: "无缝管理跨多个集群和环境的资源" },
        { title: "GPU 加速管理", description: "最大化利用专用硬件处理AI、ML和HPC工作负载" },
        { title: "成本优化与自动扩展", description: "根据工作负载需求自动扩展资源" }
      ];

  const testimonials = t('home.testimonials.items', { returnObjects: true });
  const testimonialsArray = Array.isArray(testimonials) 
    ? testimonials 
    : [
        {
          quote: "Kantaloupe极大地提高了我们的计算效率，使我们能够比以往更快地扩展AI研究。",
          author: "简博士",
          position: "首席技术官",
          company: "人工智能研究院"
        },
        {
          quote: "在我们的生产集群中，异构计算环境中的无缝集成已将部署时间减少了60%。",
          author: "李明",
          position: "工程副总裁",
          company: "全球科技公司"
        }
      ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-primary-lighter">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl text-gray-600">
                {t('home.hero.subtitle')}
              </p>
              <p className="text-md text-gray-500 italic">
                {t('home.hero.chineseSlogan')}
              </p>
              <div className="mt-4 flex flex-wrap items-center">
                <Link
                  href="/free-trial"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors mr-4"
                >
                  {t('home.cta.freeTrialButton')}
                </Link>
                <Link
                  href="/request-demo"
                  className="inline-flex items-center px-6 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 transition-colors mr-4"
                >
                  {t('home.cta.requestDemoButton')}
                </Link>
                <GitHubStars 
                  repo="Project-HAMi/HAMi" 
                  size="large"
                />
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="w-full h-full bg-primary-light rounded-lg flex items-center justify-center">
                <div className="text-center p-2">
                  <Image 
                    src="/images/products/kantaloupe.png" 
                    alt="Kantaloupe Overview" 
                    width={700}
                    height={700}
                    className="rounded-lg"
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 社会证明部分 */}
      <section className="py-12 bg-white border-t border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-lg text-gray-600 mb-8">{t('home.socialProof.title')}</p>
          <div className="relative">
            <div className="logo-scroll-container overflow-hidden whitespace-nowrap">
              <div className="logos-slide inline-block animate-scroll">
                {partnerLogos.map((logo, i) => (
                  <div key={i} className="inline-block mx-8 h-36 flex items-center justify-center">
                    <Image 
                      src={logo.src} 
                      alt={logo.name} 
                      width={360}
                      height={360}
                      className="h-auto max-h-36 w-auto"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ))}
                {/* 复制一遍 logo 以实现无缝循环效果 */}
                {partnerLogos.map((logo, i) => (
                  <div key={`dup-${i}`} className="inline-block mx-8 h-36 flex items-center justify-center">
                    <Image 
                      src={logo.src} 
                      alt={logo.name} 
                      width={360}
                      height={360}
                      className="h-auto max-h-36 w-auto"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          
          .logo-scroll-container {
            width: 100%;
          }
          
          .logos-slide {
            animation: scroll 30s linear infinite;
          }
          
          .logos-slide:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* 核心优势部分 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.keyAdvantages.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantagesArray.map((advantage, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                variants={fadeIn}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-start p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <FeatureIcon icon={Object.values(icons)[index % 4]} />
                <h3 className="mt-4 text-lg font-medium text-gray-900">{advantage.title}</h3>
                <p className="mt-2 text-base text-gray-500">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 客户评价部分 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.testimonials.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonialsArray.map((testimonial, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                variants={fadeIn}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <p className="text-gray-600 italic mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm font-bold">
                      {testimonial.author.slice(0, 2)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{testimonial.author}</p>
                    <p className="text-xs text-gray-500">
                      {testimonial.position}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 再次 CTA 部分 */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('home.cta.title')}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/free-trial"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-primary bg-white hover:bg-gray-100 transition-colors"
            >
              {t('home.cta.freeTrialButton')}
            </Link>
            <Link
              href="/request-demo"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-dark transition-colors"
            >
              {t('home.cta.requestDemoButton')}
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
