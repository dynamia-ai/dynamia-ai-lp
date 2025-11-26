"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import GitHubStars from '@/components/GitHubStars';
import Image from 'next/image';

// 动画变体
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const ecosystemRef = useRef<HTMLDivElement>(null);
  const [ecoIndex, setEcoIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const [ecoCount, setEcoCount] = useState(0);

  useEffect(() => {
    const el = ecosystemRef.current;
    if (!el) return;
    setEcoCount(el.children.length);
  }, []);

  const getStep = () => {
    const el = ecosystemRef.current as HTMLDivElement | null;
    if (!el || el.children.length < 2) return 304;
    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement;
    return second.offsetLeft - first.offsetLeft;
  };

  const scrollToIndex = (idx: number) => {
    const el = ecosystemRef.current as HTMLDivElement | null;
    if (!el) return;
    const step = getStep();
    const maxIdx = Math.max(0, ecoCount - 1);
    const clamped = Math.max(0, Math.min(maxIdx, idx));
    el.scrollTo({ left: clamped * step, behavior: 'smooth' });
    setEcoIndex(clamped);
  };

  useEffect(() => {
    if (paused || ecoCount <= 1) return;
    const id = setInterval(() => {
      setEcoIndex((prev) => {
        const next = ecoCount > 0 ? (prev + 1) % ecoCount : 0;
        const el = ecosystemRef.current as HTMLDivElement | null;
        if (el) {
          const step = getStep();
          el.scrollTo({ left: next * step, behavior: 'smooth' });
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [paused, ecoCount]);

  const handleScroll = () => {
    const el = ecosystemRef.current as HTMLDivElement | null;
    if (!el) return;
    const step = getStep();
    const idx = Math.round(el.scrollLeft / step);
    const maxIdx = Math.max(0, ecoCount - 1);
    const clamped = Math.max(0, Math.min(maxIdx, idx));
    if (clamped !== ecoIndex) setEcoIndex(clamped);
  };

  const featureTabs = t('home.keyAdvantages.tabs', { returnObjects: true });
  const featureTabsArray = Array.isArray(featureTabs)
    ? featureTabs
    : [
        {
          title: "Hetero multi-cluster",
          description: "Dynamia.ai provides a centralized approach to managing AI infrastructure, ensuring optimal workload distribution across hybrid, multi-cloud, and on-premises environments."
        },
        {
          title: "GPU Sharing",
          description: "Dynamia.ai dynamically consolidates and orchestrates GPU resources. By eliminating waste, maximizing resource utilization, enterprises achieve superior ROI, reduced operational costs, and faster scaling of AI initiatives."
        },
        {
          title: "GPU Oversubscription",
          description: "Dynamia.ai supports seamlessly unify GPU and host memory to maximize the efficiency of co-located AI workloads."
        },
        {
          title: "Seamlessly Auto Scale",
          description: "GPU on-demand auto-scaling, seamless VPA scaling for AI workloads without restarts during GPU consumption surges."
        },
        {
          title: "Centralized Observability for Complete AI insight",
          description: "Its centralized observability unifies resources from cloud, on-premises, and hybrid environments, empowering enterprises with actionable insights, policy-driven governance, and fine-grained resource management for efficient and scalable AI operations. "
        },
        {
          title: "Advanced AI Scheduling",
          description: "Advanced AI Scheduling for different scenarios including numa-aware, binpack, spread. Reduce data communication cost, minimize fragments, optimize task performance."
        }
      ];

  // Testimonials are currently not used in the UI but kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testimonials = t('home.testimonials.items', { returnObjects: true });

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
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
              <div className="mt-4 flex flex-wrap items-center">
                <Link
                  href="/apply-trial"
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
              <div className="w-full bg-primary-light rounded-lg overflow-hidden p-0">
              <div className="p-2 flex items-center justify-center">
                  <Image
                    src="/images/withhami.gif"
                    alt="Kantaloupe Overview"
                    width={650}
                    height={650}
                    className="rounded-lg"
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                    quality={100}
                    unoptimized
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 社会证明部分
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
      */}

      {/* 客户信任展示区域 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.trustedBy.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('home.trustedBy.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {(() => {
              const companies = [
                // { name: 'Company 1', logo: '/logos/company1.svg' },
                // { name: 'Company 2', logo: '/logos/company2.png' },
                // { name: 'Company 3', logo: '/logos/company3.svg' },
                // { name: 'Company 4', logo: '/logos/company4.svg' },
                // { name: 'Company 5', logo: '/logos/company5.svg' },
                { name: 'Company 8', logo: '/logos/company8.svg' },
                { name: 'Company 6', logo: '/logos/company6.png' },
                { name: 'Company 7', logo: '/logos/company7.png' },
                { name: 'Company 9', logo: '/logos/company9.svg' },
              ];
              return companies.map((company, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-center h-20 bg-white rounded-lg shadow-sm p-4"
                >
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={200}
                    height={40}
                    className="object-contain max-h-20"
                  />
                </motion.div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* 核心优势部分 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900">{t('home.keyAdvantages.title')}</h2>
          </div>
          {/* 特性标签切换区域 */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
            {featureTabsArray.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 rounded-md text-sm md:text-base font-medium transition-colors ${
                  activeTab === index
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
          {/* 特性内容展示区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* 左侧图片区域 (占2/3) */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="w-full">
                <Image
                  src={`/images/features/feature${activeTab + 1}.svg`}
                  alt={featureTabsArray[activeTab].title}
                  width={600}
                  height={400}
                  quality={100}
                  priority
                  className="rounded-lg"
                  style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                />
              </div>
            </div>
            {/* 右侧内容区域 (占1/3) */}
            <div className="lg:col-span-1">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold text-gray-900">
                  {featureTabsArray[activeTab].subtitle}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {featureTabsArray[activeTab].description}
                </p>
                <div className="pt-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary hover:bg-primary-lighter transition-colors"
                  >
                    {t('home.poweredByHami.learnMore')}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Powered by HAMi 板块 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.poweredByHami.title')}</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center mb-12 relative">
            {/* HAMi 图标 - 居中显示在左右两部分之间 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:block">
              <svg width="80" height="150" viewBox="0 0 230 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M80.2 262.3L79.5 285.2L80.1 298.9H72.7L73.3 286.1L73.2 283.3H58.9L58.8 285.2L59.4 298.9H52L52.6 286.1L52 263.6L59.5 262.3L59 277.7H73L72.6 263.6L80.2 262.3ZM110.8 299.4L108.2 289.1H95.5L92.7 299.2L85.9 298.7L90.6 285.8L97.7 263L107.2 262.3L114.1 285L118.5 298.3L110.8 299.4ZM102.4 269.1H101.7L97.1 283.4H106.6L102.4 269.1ZM140.1 283.1H140.6L148.5 262.5L156 262.7L156.2 286L157.2 300H150L150.3 285.9L149.7 271.7L143.2 289.6L136.5 289.9L130.4 271.6L129.9 285.8L130.3 300H123.6L124.4 286.8L124.7 263.6L133.3 262.2L140.1 283.1ZM170.9 272.4L170.2 285.9L170.8 298.6L163.5 300L164.2 286.8L163.6 273.7L170.9 272.4Z" fill="#1B1C1D"/>
                <path d="M162.4 264.8C162.4 263.6 162.9 262.4 163.9 261.5C164.9 260.6 166.1 260 167.4 260C168.7 260 169.7 260.3 170.4 261C171.1 261.7 171.4 262.7 171.4 264.1C171.4 265.5 170.9 266.6 169.9 267.6C168.9 268.6 167.8 269.1 166.5 269.1C165.2 269.1 164.2 268.7 163.5 267.9C162.8 267 162.4 266 162.4 264.8Z" fill="#0FD05D"/>
                <path d="M143.675 0C152.375 10.3 162.775 18.7 174.675 25C186.875 31.5 200.075 35.3 213.875 36.6L213.075 45.5C198.075 44.2 183.775 39.9 170.575 32.9C168.675 31.9 166.875 30.9 165.075 29.8C161.375 33.6 158.075 37.7 155.175 42.1C172.275 50.6 186.475 64 196.175 81.2C209.075 104 212.375 130.6 205.575 156.1C198.775 181.6 182.575 203.1 160.075 216.4C144.875 225.4 127.975 230 110.975 230C102.675 230 94.375 228.9 86.275 226.7C61.175 220 40.275 203.8 27.375 180.9C14.375 158.2 10.975 131.6 17.875 106C24.675 80.5 40.875 59 63.375 45.7C85.975 32.3 112.175 28.7 137.275 35.3C140.575 36.2 143.675 37.2 146.775 38.4C149.875 33.5 153.475 28.9 157.375 24.7C149.775 19.3 142.875 12.9 136.775 5.7L143.675 0ZM112.575 41C97.075 41 81.775 45.2 67.975 53.4C47.375 65.5 32.675 85.1 26.475 108.3C20.275 131.5 23.275 155.8 34.975 176.6C46.675 197.3 65.675 212.1 88.375 218.1C95.775 220.1 103.275 221.1 110.775 221.1C126.275 221.1 141.575 216.9 155.375 208.7C175.875 196.5 190.575 177 196.875 153.8C203.175 130.6 200.075 106.3 188.375 85.5C176.675 64.8 157.675 50 134.975 44C127.575 42 119.975 41 112.575 41ZM106.875 48.5C141.775 80.8 164.375 123.9 170.975 171.4C171.675 176.3 172.175 181.8 172.575 187.4C169.875 190.5 167.075 193.3 164.075 195.9C163.875 187.9 163.175 179.6 162.275 172.6C156.275 129.2 136.275 89.6 105.375 59.3C123.475 86.3 134.975 117.2 138.775 149.9C141.275 170.7 140.575 191.4 136.775 211.6C131.375 213.5 125.675 214.8 119.975 215.5C120.075 213.5 120.075 211.5 120.075 209.6C120.075 206.8 119.975 204 119.875 201.3C116.675 201.6 113.375 201.8 110.175 201.8C106.475 201.8 102.875 201.6 99.275 201.2C99.575 198.2 99.875 195.3 99.975 192.3C106.375 193.1 112.875 193.1 119.275 192.4C117.375 170 111.675 148.4 102.375 127.8C92.775 107 79.875 88.2 63.875 71.8C83.775 104.2 94.175 141.1 94.175 179.5C94.175 191.1 93.175 202.6 91.275 214C90.675 213.9 89.975 213.7 89.375 213.5C87.075 212.9 84.875 212.2 82.675 211.4C83.375 207.1 83.975 202.7 84.375 198.3C78.475 196.6 72.775 194.4 67.275 191.7C67.475 188.4 67.575 185.1 67.575 181.8C73.075 184.9 78.875 187.4 84.975 189.2C85.175 186 85.175 182.7 85.175 179.5C85.175 141.3 74.375 104.5 53.775 72.7C57.775 68.8 62.075 65.2 66.675 62.2C84.975 80.1 99.675 100.9 110.275 124.3C121.875 149.8 128.075 177 128.675 205.2C131.475 187.4 131.875 169.3 129.675 151.1C125.375 114.6 111.175 80.5 88.575 51.9C94.575 50 100.675 48.9 106.875 48.5ZM41.375 90.5C47.275 103 51.875 116 55.075 129.4C58.975 145.6 60.975 162.3 60.975 179.1C60.975 185.3 60.675 191.5 60.175 197.7C57.275 195.3 54.475 192.6 51.975 189.8C52.175 186.2 52.275 182.7 52.275 179.1C52.275 152.2 46.775 125.4 36.375 100.9C37.875 97.3 39.575 93.8 41.375 90.5ZM171.575 85.6C179.575 97.8 184.875 111.9 186.875 126.4L178.075 127.6C176.275 114.4 171.475 101.5 164.175 90.5L171.575 85.6ZM152.975 64.7C157.175 68.2 161.075 72.1 164.675 76.3L157.875 82C154.675 78.2 151.075 74.6 147.275 71.5L152.975 64.7Z" fill="#0FD05D"/>
              </svg>
            </div>

            {/* 左侧描述 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:w-1/2 flex flex-col items-center text-center"
            >
              <p className="text-lg text-gray-700 max-w-md">
                {t('home.poweredByHami.description')}
              </p>
            </motion.div>

            {/* 右侧图片占位 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:w-1/2 flex items-center justify-center"
            >
              <div className="aspect-w-16 aspect-h-9 w-full">
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src="/images/cncfsandbox.png"
                    alt="CNCF Sandbox Project"
                    width={400}
                    height={230}
                    className="object-contain"
                    style={{ maxHeight: '50%', maxWidth: '50%' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 按钮 - 独立居中在HAMi图标下方 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <Link
              href="/what-is-hami"
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0FD05D] hover:bg-[#0AB04D] transition-colors"
            >
              {t('home.poweredByHami.learnMore')}
            </Link>
          </motion.div>

          {/* 下方统计数据 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="container">
                <div className="flex flex-wrap items-center justify-around">
                  <div className="mb-4 md:mb-0 text-center px-4">
                    <span className="block text-2xl font-bold text-[#0FD05D]">{t('home.poweredByHami.stats.contributors')}</span>
                    <span className="text-gray-600">[ Contributors ]</span>
                  </div>

                  <div className="mb-4 md:mb-0 text-center px-4">
                    <span className="block text-2xl font-bold text-[#0FD05D]">{t('home.poweredByHami.stats.forks')}</span>
                    <span className="text-gray-600">[ Forks ]</span>
                  </div>

                  <div className="mb-4 md:mb-0 text-center px-4">
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0FD05D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span className="ml-2 text-2xl font-bold text-[#0FD05D]">{t('home.poweredByHami.stats.stars')}</span>
                    </div>
                    <span className="text-gray-600">[ Stars ]</span>
                  </div>

                  <div className="mb-4 md:mb-0 text-center px-4">
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0FD05D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                      <span className="ml-2 text-2xl font-bold text-[#0FD05D]">{t('home.poweredByHami.stats.commits')}</span>
                    </div>
                    <span className="text-gray-600">[ Commits ]</span>
                  </div>

                  <div className="text-center px-4">
                    <span className="block text-2xl font-bold text-[#0FD05D]">{t('home.poweredByHami.stats.pulls')}</span>
                    <span className="text-gray-600">[ Pulls ]</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Join our community 板块 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.joinCommunity.title')}</h2>
          </div>

          <div className="flex justify-center gap-4 max-w-6xl mx-auto">
            {/* Bilibili Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-[200px]"
            >
              <Link href="https://space.bilibili.com/1105878584" className="flex flex-col items-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.283-.249.585-.373.907-.373.322 0 .624.124.907.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.283-.249.585-.373.907-.373.322 0 .624.124.907.373.249.249.373.551.373.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96v-1.173c0-.373.129-.689.387-.947.258-.258.574-.387.947-.387zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96v-1.173c0-.373.129-.689.387-.947.258-.258.574-.387.947-.387z" fill="#00A1D6"/>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('home.joinCommunity.bilibili.title')}</h3>
                <div className="flex items-center text-primary text-xs">
                  <span className="mr-1">{t('home.joinCommunity.bilibili.action')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Slack Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-[200px]"
            >
              <Link href="https://cloud-native.slack.com/archives/C07T10BU4R2" className="flex flex-col items-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.8 122.8" width="36" height="36">
                    <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"></path>
                    <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"></path>
                    <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"></path>
                    <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"></path>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('home.joinCommunity.slack.title')}</h3>
                <div className="flex items-center text-primary text-xs">
                  <span className="mr-1">{t('home.joinCommunity.slack.action')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Discord Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-[200px]"
            >
              <Link href="https://discord.gg/AgdQt5Xp" className="flex flex-col items-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" width="36" height="36">
                    <path fill="#5865F2" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('home.joinCommunity.discord.title')}</h3>
                <div className="flex items-center text-primary text-xs">
                  <span className="mr-1">{t('home.joinCommunity.discord.action')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Reddit Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-[200px]"
            >
              <Link href="https://www.reddit.com/r/HAMi_Community/" className="flex flex-col items-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="36" height="36">
                    <g>
                      <circle fill="#FF4500" cx="10" cy="10" r="10"/>
                      <path fill="#FFF" d="M16.67,10A1.46,1.46,0,0,0,14.2,9a7.12,7.12,0,0,0-3.85-1.23L11,4.65,13.14,5.1a1,1,0,1,0,.13-0.61L10.82,4a0.31,0.31,0,0,0-.37.24L9.71,7.71a7.14,7.14,0,0,0-3.9,1.23A1.46,1.46,0,1,0,4.2,11.33a2.87,2.87,0,0,0,0,.44c0,2.24,2.61,4.06,5.83,4.06s5.83-1.82,5.83-4.06a2.87,2.87,0,0,0,0-.44A1.46,1.46,0,0,0,16.67,10Zm-10,1a1,1,0,1,1,1,1A1,1,0,0,1,6.67,11Zm5.81,2.75a3.84,3.84,0,0,1-2.47.77,3.84,3.84,0,0,1-2.47-.77,0.27,0.27,0,0,1,.38-0.38A3.27,3.27,0,0,0,10,14a3.28,3.28,0,0,0,2.09-.61A0.27,0.27,0,1,1,12.48,13.79Zm-0.18-1.71a1,1,0,1,1,1-1A1,1,0,0,1,12.29,12.08Z"/>
                    </g>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('home.joinCommunity.reddit.title')}</h3>
                <div className="flex items-center text-primary text-xs">
                  <span className="mr-1">{t('home.joinCommunity.reddit.action')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* WeChat Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-[200px] group relative"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M199.836 135.671C199.836 106.419 171.913 82.7169 137.478 82.7169C103.024 82.7169 75.1018 106.425 75.1018 135.671C75.1018 164.918 103.024 188.626 137.478 188.626C148.299 188.626 158.483 186.266 167.368 182.139L191.95 192.778L189.103 165.355C195.89 156.888 199.842 146.661 199.842 135.671H199.836ZM116.455 121.323C111.547 121.323 107.583 117.352 107.583 112.45C107.583 107.549 111.547 103.578 116.455 103.578C121.357 103.578 125.321 107.555 125.321 112.45C125.321 117.346 121.344 121.323 116.455 121.323ZM158.483 121.323C153.594 121.323 149.616 117.352 149.616 112.45C149.616 107.549 153.594 103.578 158.483 103.578C163.397 103.578 167.368 107.555 167.368 112.45C167.368 117.346 163.397 121.323 158.483 121.323ZM137.478 75.705C147.113 75.705 156.291 77.4221 164.652 80.5128C164.714 79.3951 164.845 78.3212 164.845 77.1973C164.845 38.5475 127.938 7.22186 82.4196 7.22186C36.914 7.22186 0.00634766 38.5413 0.00634766 77.1973C0.00634766 91.7331 5.23874 105.251 14.1925 116.44L10.4337 152.667L42.9082 138.6C50.9503 142.346 59.8417 144.875 69.2262 146.167C68.5207 142.752 68.0899 139.255 68.0899 135.671C68.0961 102.61 99.222 75.7112 137.478 75.7112V75.705ZM110.199 34.8074C116.674 34.8074 121.906 40.0523 121.906 46.5147C121.906 52.9897 116.674 58.2345 110.199 58.2345C103.724 58.2345 98.4852 52.9897 98.4852 46.5147C98.4852 40.0461 103.73 34.8074 110.199 34.8074ZM54.6405 58.2345C48.1656 58.2345 42.9332 52.9897 42.9332 46.5147C42.9332 40.0461 48.1718 34.8074 54.6405 34.8074C61.1154 34.8074 66.354 40.0523 66.354 46.5147C66.354 52.9772 61.1092 58.2345 54.6405 58.2345Z" fill="#51C332"/>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('home.joinCommunity.wechat.title')}</h3>
                <div className="flex items-center text-primary text-xs">
                  <span className="mr-1">{t('home.joinCommunity.wechat.action')}</span>
                </div>
                {/* 悬浮显示二维码 */}
                <div className="absolute top-[-170px] left-[50%] translate-x-[-50%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white p-2 rounded-lg shadow-lg z-10">
                  <div className="w-[150px] h-[150px] flex items-center justify-center">
                    <Image
                      src="/images/hami-qr-code.png"
                      alt="WeChat QR Code"
                      width={150}
                      height={150}
                      className="rounded-md"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 生态集成 板块 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.ecosystem.title')}</h2>
            <p className="mt-4 text-lg text-gray-600">{t('home.ecosystem.subtitle')}</p>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Carousel viewport */}
            <div
              ref={ecosystemRef}
              className="flex flex-nowrap gap-6 overflow-x-auto scroll-smooth py-2"
              onScroll={handleScroll}
            >

            {/* vLLM Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow w-[280px] flex-shrink-0"
            >
              <Link href="https://github.com/vllm-project/production-stack/" className="flex flex-col items-center">
                <div className="w-48 h-20 flex items-center justify-center">
                  <Image
                    src="/images/vllm.png"
                    alt="vLLM"
                    width={240}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center text-primary text-sm">
                  <span className="mr-1">{t('home.ecosystem.viewDetails')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Volcano Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow w-[280px] flex-shrink-0"
            >
              <Link href="https://github.com/volcano-sh/volcano/blob/master/docs/user-guide/how_to_use_volcano_vgpu.md" className="flex flex-col items-center">
                <div className="w-48 h-20 flex items-center justify-center">
                  <Image
                    src="/images/volcano.png"
                    alt="Volcano"
                    width={240}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center text-primary text-sm">
                  <span className="mr-1">{t('home.ecosystem.viewDetails')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Koordinator Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow w-[280px] flex-shrink-0"
            >
              <Link href="https://koordinator.sh/docs/user-manuals/device-scheduling-gpu-share-with-hami" className="flex flex-col items-center">
                <div className="w-48 h-20 flex items-center justify-center">
                  <Image
                    src="/images/koordinator.png"
                    alt="Koordinator"
                    width={240}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center text-primary text-sm">
                  <span className="mr-1">{t('home.ecosystem.viewDetails')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Xinference Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow w-[280px] flex-shrink-0"
            >
              <Link href="https://inference.readthedocs.io/en/latest/" className="flex flex-col items-center">
                <div className="w-48 h-20 flex items-center justify-center">
                  <Image
                    src="/images/xinference.png"
                    alt="Xinference"
                    width={240}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center text-primary text-sm">
                  <span className="mr-1">{t('home.ecosystem.viewDetails')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            {/* Kueue Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow w-[280px] flex-shrink-0"
            >
              <Link href="https://kueue.sigs.k8s.io/docs/" className="flex flex-col items-center">
                <div className="w-48 h-20 flex items-center justify-center">
                  <Image
                    src="/images/kueue.svg"
                    alt="Kueue"
                    width={160}
                    height={65}
                    className="object-contain max-w-[160px] max-h-[65px]"
                  />
                </div>
                <div className="flex items-center text-primary text-sm">
                  <span className="mr-1">{t('home.ecosystem.viewDetails')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>

            </div>
            {/* Navigation buttons */}
            <button
              aria-label="Previous"
              onClick={() => scrollToIndex(ecoIndex - 1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 border border-gray-200 rounded-full w-9 h-9 hidden md:flex items-center justify-center shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              aria-label="Next"
              onClick={() => scrollToIndex(ecoIndex + 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 border border-gray-200 rounded-full w-9 h-9 hidden md:flex items-center justify-center shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {/* Indicators */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-28px] flex items-center gap-2">
              {Array.from({ length: Math.max(ecoCount, 0) }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => scrollToIndex(i)}
                  className={`${i === ecoIndex ? 'bg-primary' : 'bg-gray-300'} w-2.5 h-2.5 rounded-full transition-colors`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 再次 CTA 部分 */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('home.cta.title')}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply-trial"
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
