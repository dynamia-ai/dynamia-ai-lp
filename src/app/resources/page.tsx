"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

interface ResourceArticle {
  title: string;
  category: string;
  date: string;
  excerpt: string;
  link: string;
}

export default function Resources() {
  const { t } = useTranslation();

  // 资源卡片组件
  const ResourceCard = ({ title, description, link, icon }: { title: string; description: string; link: string; icon: string }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg transition-all hover:shadow-md">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 h-10 w-10 bg-primary-light rounded-full flex items-center justify-center">
            <span className="text-primary text-xl">{icon}</span>
          </div>
          <h3 className="ml-4 text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <Link
          href={link}
          className="text-primary hover:text-primary-dark font-medium text-sm"
        >
          {t('resources.viewMore')} &rarr;
        </Link>
      </div>
    </div>
  );
  
  // 获取文章并确保类型安全
  const articlesFromTranslation = t('resources.latestResources.articles', { returnObjects: true });
  const articles: ResourceArticle[] = Array.isArray(articlesFromTranslation) 
    ? articlesFromTranslation 
    : [
        {
          title: "Kantaloupe v2.0 Release: New Features and Improvements",
          category: "Blog",
          date: "2025-01-15",
          excerpt: "Learn about the important updates and performance enhancements in the latest version of Kantaloupe.",
          link: "/resources/blog/kantaloupe-v2-release"
        }
      ];

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('resources.title')}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('resources.subtitle')}
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ResourceCard
                title={t('resources.documentation.title')}
                description={t('resources.documentation.description')}
                link="/resources/documentation"
                icon="📚"
              />
              <ResourceCard
                title={t('resources.blog.title')}
                description={t('resources.blog.description')}
                link="/resources/blog"
                icon="✏️"
              />
              <ResourceCard
                title={t('resources.whitepapers.title')}
                description={t('resources.whitepapers.description')}
                link="/resources/whitepapers"
                icon="📄"
              />
            </div>
          </div>

          <div className="mt-16">
            <div className="bg-primary-lighter rounded-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{t('resources.latestResources.title')}</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {articles.map((article, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-primary-dark bg-primary-lighter px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">{article.date}</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{article.excerpt}</p>
                    <Link href={article.link} className="text-primary hover:text-primary-dark font-medium text-sm">
                      {t('resources.viewMore')} &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 bg-gray-100 rounded-lg p-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('resources.latestResources.newsletterTitle')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('resources.latestResources.newsletterDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="email"
                  placeholder={t('resources.latestResources.emailPlaceholder')}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary w-full sm:w-auto"
                />
                <button
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  {t('resources.latestResources.subscribeButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 