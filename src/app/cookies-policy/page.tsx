"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';
import { DocumentTextIcon, CogIcon } from '@heroicons/react/24/outline';

// 辅助函数：将文本中的换行符转换为段落和行内换行
const TextWithBreaks = ({ text }: { text: string }) => {
  if (!text) return null;
  
  return (
    <>
      {text.split('\n\n').map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  );
};

export default function CookiesPolicy() {
  const { t } = useTranslation();
  
  // Get cookies policy sections from translations
  const sections = t('cookiesPolicy.sections', { returnObjects: true });
  const policySections = Array.isArray(sections) ? sections : [];

  return (
    <MainLayout>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-light to-primary-lighter py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block p-3 bg-white rounded-full mb-4">
            <CogIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('cookiesPolicy.title')}</h1>
          <p className="text-gray-600">{t('cookiesPolicy.lastUpdated')}</p>
        </div>
      </div>

      {/* Content Section */}
      <main className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <div className="prose prose-lg max-w-none">
              {/* Introduction paragraphs with consistent icons */}
              <div className="flex items-start mb-6 pb-4 border-b border-gray-100">
                <DocumentTextIcon className="w-6 h-6 text-gray-500 mr-3 flex-shrink-0 mt-1" />
                <div className="text-gray-700">
                  <TextWithBreaks text={t('cookiesPolicy.intro')} />
                </div>
              </div>
              
              <div className="space-y-8">
                {policySections.map((section, index) => (
                  <div key={index} className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
                    <div className="text-gray-700">
                      <TextWithBreaks text={section.content} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </main>
    </MainLayout>
  );
} 