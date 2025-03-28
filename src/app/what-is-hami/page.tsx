'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function HamiPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6 md:col-span-3"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                <span className={isZh ? "text-1xl md:text-5xl" : "text-3xl md:text-5xl"}>
                  {t('hamiPage.title')}
                </span>
                {' '}<span className="text-[#0FD05D]">HAMi</span>?
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-700">
                {t('hamiPage.subtitle')}
              </h2>
              <div className="space-y-4">
                <p className="text-lg text-gray-600">
                  {t('hamiPage.introduction')}
                </p>
                <p className="text-lg text-gray-600">
                  {t('hamiPage.creator')}
                </p>
              </div>
            </motion.div>
            {/* Right HAMi Logo */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex justify-center md:col-span-2"
            >
              <div className="w-full max-w-xs bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <Image
                  src="/hami.svg"
                  alt="HAMi Logo"
                  width={300}
                  height={300}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
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

      {/* GitHub Button Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <a
              href="https://github.com/Project-HAMi/HAMi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0FD05D] hover:bg-[#0AB04D] shadow-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" className="mr-2">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {t('hamiPage.githubButton')}
            </a>
          </motion.div>
        </div>
      </section>

      {/* Images Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
              className="flex-1 flex justify-center"
            >
              <a
                href="https://landscape.cncf.io/?selected=hami&item=orchestration-management--scheduling-orchestration--hami"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-105 block"
              >
                <Image
                  src="/images/cncfsandbox.png"
                  alt="CNCF Sandbox Project"
                  width={250}
                  height={150}
                  className="rounded-lg shadow-sm object-contain bg-white p-4 hover:shadow-md"
                />
              </a>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 flex justify-center"
            >
              <a
                href="https://landscape.cncf.io/?selected=hami&group=cnai&item=orchestration-management--scheduling-orchestration--hami"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-105 block"
              >
                <Image
                  src="/images/cnailandscape.png"
                  alt="CNAI Landscape"
                  width={250}
                  height={150}
                  className="rounded-lg shadow-sm object-contain bg-white p-4 hover:shadow-md"
                />
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
} 