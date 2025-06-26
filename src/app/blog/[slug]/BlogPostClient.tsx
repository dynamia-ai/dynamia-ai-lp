"use client";

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { formatDate } from '@/lib/blog-client';
import { BlogPost } from '@/types/blog';

interface BlogPostClientProps {
  enPost: (BlogPost & { content: string }) | null;
  zhPost: (BlogPost & { content: string }) | null;
}

export default function BlogPostClient({ enPost, zhPost }: BlogPostClientProps) {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language as 'en' | 'zh';
  
  // Select the appropriate post based on language
  const post = currentLocale === 'zh' ? zhPost : enPost;
  const fallbackPost = currentLocale === 'zh' ? enPost : zhPost;
  const displayPost = post || fallbackPost;

  if (!displayPost) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {currentLocale === 'zh' ? '文章未找到' : 'Post Not Found'}
            </h1>
            <p className="text-gray-600 mb-8">
              {currentLocale === 'zh' 
                ? '您要查找的文章不存在或已被删除。' 
                : 'The post you are looking for does not exist or has been removed.'
              }
            </p>
            <Link 
              href="/blog"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              {currentLocale === 'zh' ? '返回博客' : 'Back to Blog'}
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-primary">
                  {currentLocale === 'zh' ? '首页' : 'Home'}
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/blog" className="hover:text-primary">
                  {currentLocale === 'zh' ? '博客' : 'Blog'}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{displayPost.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {displayPost.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8">
              <div className="flex items-center">
                <span className="font-medium">{displayPost.author}</span>
              </div>
              <div className="flex items-center">
                <time dateTime={displayPost.date}>
                  {formatDate(displayPost.date, currentLocale)}
                </time>
              </div>
              <div className="flex items-center">
                <span>{displayPost.readingTime}</span>
              </div>
            </div>

            {displayPost.tags && displayPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {displayPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-primary-lighter text-primary-dark text-sm px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {displayPost.coverImage && (
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <Image
                  src={displayPost.coverImage}
                  alt={displayPost.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                />
              </div>
            )}
          </motion.header>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: displayPost.content }}
          />



          {/* Back to blog */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 pt-8 border-t border-gray-200"
          >
            <Link 
              href="/blog"
              className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {currentLocale === 'zh' ? '返回博客' : 'Back to Blog'}
            </Link>
          </motion.div>
        </div>
      </article>
    </MainLayout>
  );
} 