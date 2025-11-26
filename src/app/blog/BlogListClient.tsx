"use client";

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { BlogPostMeta } from '@/types/blog';
import DynamicBlogCover from '@/components/DynamicBlogCover';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Blog card component
const BlogCard = ({ post, currentLocale }: { post: BlogPostMeta; currentLocale: 'en' | 'zh' }) => {
  // 根据当前语言生成博客文章路径
  const blogPath = currentLocale === 'zh' ? `/zh/blog/${post.slug}` : `/blog/${post.slug}`;
  
  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      variants={fadeIn}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow duration-300"
    >
      <Link href={blogPath}>
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          {/* 悬停时封面图放大 */}
          <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105">
            <DynamicBlogCover
              title={post.coverTitle || post.title}
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-primary transition-colors">
            {post.title}
          </h2>

          <p className="text-gray-600 mb-4 line-clamp-2">
            {post.excerpt}
          </p>

        </div>
      </Link>
    </motion.article>
  );
};

interface BlogListClientProps {
  enPosts: BlogPostMeta[];
  zhPosts: BlogPostMeta[];
  enTags: string[];
  zhTags: string[];
  selectedTag?: string;
}

export default function BlogListClient({
  enPosts,
  zhPosts,
  enTags,
  zhTags,
  selectedTag
}: BlogListClientProps) {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentLocale = i18n.language as 'en' | 'zh';
  const [isExpanded, setIsExpanded] = useState(false);

  // 客户端筛选状态（避免服务器端重新渲染）
  const [clientSelectedTag, setClientSelectedTag] = useState<string | undefined>(selectedTag);

  // Get posts and tags for current language
  const allPosts = currentLocale === 'zh' ? zhPosts : enPosts;
  const allTags = currentLocale === 'zh' ? zhTags : enTags;

  // Filter posts by selected tag - 使用客户端状态
  const posts = useMemo(() => {
    if (!clientSelectedTag) {
      return allPosts;
    }
    return allPosts.filter(post =>
      post.tags.some(tag => tag.toLowerCase() === clientSelectedTag.toLowerCase())
    );
  }, [allPosts, clientSelectedTag]);

  // Show first 8 tags by default, rest can be expanded
  const INITIAL_TAGS_COUNT = 8;
  const visibleTags = allTags.slice(0, INITIAL_TAGS_COUNT);
  const hasMoreTags = allTags.length > INITIAL_TAGS_COUNT;
  const additionalTags = allTags.slice(INITIAL_TAGS_COUNT);

  // Handle tag click - 完全客户端筛选，避免服务器端重新渲染
  const handleTagClick = (tag: string) => {
    // 更新客户端状态（立即生效，无延迟）
    const newTag = (!tag || clientSelectedTag === tag) ? undefined : tag;
    setClientSelectedTag(newTag);

    // 更新 URL（用于可分享性，但不触发服务器端重新渲染）
    const params = new URLSearchParams(searchParams.toString());
    if (!newTag) {
      params.delete('tag');
    } else {
      params.set('tag', newTag);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // 使用 window.history.replaceState 更新 URL，不触发服务器端重新渲染
    window.history.replaceState(null, '', newUrl);
  };

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              {t('resources.blog.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('resources.blog.description')}
            </p>
          </motion.div>

          {/* Filter by Tags */}
          {allTags.length > 0 && (
            <div className="mb-10">
              {/* Filter by Tags title - separate row */}
              <div className="flex items-center gap-2.5 mb-5">
                {/* Tag icon */}
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {t('resources.blog.filterByTags')}
                </h2>
              </div>

              {/* Tags container - first row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* All Tags button */}
                <button
                  onClick={() => handleTagClick('')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    !clientSelectedTag
                      ? 'bg-primary text-white shadow-sm hover:shadow-md hover:bg-primary-dark'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {t('resources.blog.allTags')}
                </button>

                {/* Individual tags - first row */}
                {visibleTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                      clientSelectedTag?.toLowerCase() === tag.toLowerCase()
                        ? 'bg-primary text-white shadow-sm hover:shadow-md hover:bg-primary-dark'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {tag}
                  </button>
                ))}

                {/* More button */}
                {hasMoreTags && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap text-primary hover:text-primary-dark cursor-pointer flex items-center gap-1.5"
                  >
                    {isExpanded ? (
                      <>
                        {t('resources.blog.less')}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        {t('resources.blog.more')}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Additional tags row - shown when expanded */}
              {isExpanded && hasMoreTags && (
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {additionalTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                        clientSelectedTag?.toLowerCase() === tag.toLowerCase()
                          ? 'bg-primary text-white shadow-sm hover:shadow-md hover:bg-primary-dark'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Show selected tag info */}
              {clientSelectedTag && (
                <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {t('resources.blog.showingPostsTagged', { tag: clientSelectedTag, count: posts.length })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Blog posts grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard
                  currentLocale={currentLocale}
                  key={post.slug}
                  post={post}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {currentLocale === 'zh' ? '暂无文章' : 'No posts yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {currentLocale === 'zh'
                    ? '我们即将发布第一篇博客文章，敬请期待！'
                    : "We're working on our first blog posts. Stay tuned!"
                  }
                </p>
              </div>
            </div>
          )}

          {/* Newsletter CTA */}
          {posts.length > 0 && (
            <div className="mt-16 bg-gradient-to-r from-primary-light to-primary-lighter rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentLocale === 'zh' ? '订阅我们的博客' : 'Subscribe to our blog'}
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                {currentLocale === 'zh'
                  ? '获取最新的技术文章、教程和 HAMi 社区更新。'
                  : 'Get the latest technical articles, tutorials, and HAMi community updates.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={currentLocale === 'zh' ? '您的邮箱地址' : 'Your email address'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <button className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                  {currentLocale === 'zh' ? '订阅' : 'Subscribe'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}