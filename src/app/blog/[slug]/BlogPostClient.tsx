"use client";

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { formatDate } from '@/lib/blog-client';
import { BlogPost } from '@/types/blog';
import TableOfContents from '@/components/TableOfContents';
import DynamicBlogCover from '@/components/DynamicBlogCover';
import BlogShareButtons from '@/components/BlogShareButtons';
import BlogAIShareSection from '@/components/BlogAIShareSection';

interface BlogPostClientProps {
  enPost: (BlogPost & { content: string }) | null;
  zhPost: (BlogPost & { content: string }) | null;
}

export default function BlogPostClient({ enPost, zhPost }: BlogPostClientProps) {
  const { i18n } = useTranslation();
  const router = useRouter();
  const currentLocale = i18n.language as 'en' | 'zh';
  
  // Select the appropriate post based on language
  const post = currentLocale === 'zh' ? zhPost : enPost;
  // 根据当前语言生成博客路径
  const blogListPath = currentLocale === 'zh' ? '/zh/blog' : '/blog';
  const getBlogPostPath = (slug: string) => currentLocale === 'zh' ? `/zh/blog/${slug}` : `/blog/${slug}`;
  
  // 如果当前语言的博客不存在，但另一个语言的博客存在，重定向到博客列表页
  useEffect(() => {
    if (!post && (enPost || zhPost)) {
      router.replace(blogListPath);
    }
  }, [currentLocale, post, enPost, zhPost, router, blogListPath]);
  
  const displayPost = post;

  useEffect(() => {
    if (!displayPost) {
      return;
    }

    const container = document.querySelector('.blog-content');
    if (!container) {
      return;
    }

    const copyLabel = currentLocale === 'zh' ? '复制' : 'Copy';
    const copiedLabel = currentLocale === 'zh' ? '已复制' : 'Copied';
    const failedLabel = currentLocale === 'zh' ? '复制失败' : 'Copy failed';
    const ariaLabel = currentLocale === 'zh' ? '复制代码块' : 'Copy code snippet';

    type CopyState = 'idle' | 'copied' | 'failed';

    const ensureButtonStructure = (btn: HTMLButtonElement) => {
      if (!btn.classList.contains('code-copy-enhanced')) {
        btn.innerHTML = '<span class="code-copy-icon" aria-hidden="true"></span><span class="code-copy-text"></span>';
        btn.classList.add('code-copy-enhanced');
      }
    };

    const setButtonLabel = (btn: HTMLButtonElement, label: string) => {
      const textSpan = btn.querySelector<HTMLSpanElement>('.code-copy-text');
      if (textSpan) {
        textSpan.textContent = label;
      } else {
        btn.textContent = label;
      }
    };

    const setButtonState = (btn: HTMLButtonElement, state: CopyState) => {
      btn.classList.toggle('copied', state === 'copied');
      btn.classList.toggle('copy-failed', state === 'failed');
      btn.setAttribute('data-copy-state', state);
    };

    const writeToClipboard = async (text: string) => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // fall back to legacy approach below
        }
      }

      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);

        const selection = document.getSelection();
        const selectedRange = selection?.rangeCount ? selection.getRangeAt(0) : null;

        textArea.select();
        const success = document.execCommand('copy');

        document.body.removeChild(textArea);

        if (selectedRange && selection) {
          selection.removeAllRanges();
          selection.addRange(selectedRange);
        }

        return success;
      } catch {
        return false;
      }
    };

    const cleanups: Array<() => void> = [];

    const ensureCodeBlockContainer = (preElement: HTMLElement): HTMLDivElement | null => {
      const parent = preElement.parentElement;
      if (!parent) {
        return null;
      }

      if (parent.classList.contains('code-block')) {
        return parent as HTMLDivElement;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      parent.insertBefore(wrapper, preElement);
      wrapper.appendChild(preElement);
      return wrapper;
    };

    const preElements = Array.from(container.querySelectorAll('pre'));

    preElements.forEach((pre) => {
      const preElement = pre as HTMLElement;
      const codeElement = preElement.querySelector('code');
      if (!codeElement) {
        return;
      }

      const containerEl = ensureCodeBlockContainer(preElement);
      if (!containerEl) {
        return;
      }

      let copyButton = containerEl.querySelector<HTMLButtonElement>('button.code-copy-button');

      if (!copyButton) {
        const existingInsidePre = preElement.querySelector<HTMLButtonElement>('button.code-copy-button');
        if (existingInsidePre) {
          copyButton = existingInsidePre;
          containerEl.appendChild(existingInsidePre);
        }
      }

      if (!copyButton) {
        copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'code-copy-button';
        containerEl.appendChild(copyButton);
      }

      ensureButtonStructure(copyButton);
      setButtonLabel(copyButton, copyLabel);
      setButtonState(copyButton, 'idle');
      copyButton.setAttribute('aria-label', ariaLabel);

      let resetTimeoutId: number | undefined;

      const handleCopy = async () => {
        if (resetTimeoutId) {
          window.clearTimeout(resetTimeoutId);
        }

        const success = await writeToClipboard(codeElement.textContent ?? '');

        if (success) {
          setButtonState(copyButton, 'copied');
          setButtonLabel(copyButton, copiedLabel);
        } else {
          setButtonState(copyButton, 'failed');
          setButtonLabel(copyButton, failedLabel);
        }

        resetTimeoutId = window.setTimeout(() => {
          setButtonState(copyButton, 'idle');
          setButtonLabel(copyButton, copyLabel);
        }, 2000);
      };

      copyButton.onclick = handleCopy;

      cleanups.push(() => {
        if (resetTimeoutId) {
          window.clearTimeout(resetTimeoutId);
        }
        if (copyButton) {
          copyButton.onclick = null;
        }
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [displayPost, currentLocale]);

  // 如果当前语言的博客不存在，但另一个语言的博客存在，显示加载状态（正在重定向）
  // 只有在两个语言的博客都不存在时，才显示 "Post Not Found"
  if (!post && (enPost || zhPost)) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">
              {currentLocale === 'zh' ? '正在跳转...' : 'Redirecting...'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

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
              href={blogListPath}
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
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-start">
            <div className="max-w-4xl xl:mr-60">
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
                <Link href={blogListPath} className="hover:text-primary">
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

            {/* Published Date */}
            <div className="mb-4 text-sm text-gray-500">
              <time dateTime={displayPost.date}>
                {formatDate(displayPost.date, currentLocale)}
              </time>
            </div>

            {displayPost.tags && displayPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {displayPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-primary-lighter text-primary-dark text-sm font-semibold px-3.5 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Excerpt */}
            {displayPost.excerpt && (
              <div className="mb-8 relative pl-6 border-l-4 border-gray-300">
                <p className="text-lg text-gray-600 leading-7 italic">
                  {displayPost.excerpt}
                </p>
              </div>
            )}

            <div className="aspect-video relative rounded-lg overflow-hidden">
              <DynamicBlogCover
                title={displayPost.coverTitle || displayPost.title}
                className="w-full h-full"
                variant="detail"
              />
            </div>

            {/* Share Buttons */}
            <BlogShareButtons 
              title={displayPost.title}
              url={getBlogPostPath(displayPost.slug)}
            />
          </motion.header>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: displayPost.content }}
              />

              {/* AI Share Section */}
              <div className="mt-12">
                <BlogAIShareSection
                  title={displayPost.title}
                  url={getBlogPostPath(displayPost.slug)}
                />
              </div>

              {/* Back to blog */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-12 pt-8 border-t border-gray-200"
              >
                <Link 
                  href={blogListPath}
                  className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {currentLocale === 'zh' ? '返回博客' : 'Back to Blog'}
                </Link>
              </motion.div>
            </div>

          </div>
          
          {/* Table of Contents - 固定在页面最右侧 */}
          <aside className="hidden xl:block fixed right-8 top-24 w-64 z-10">
            <TableOfContents toc={displayPost.toc || []} />
          </aside>
        </div>
      </article>
    </MainLayout>
  );
} 
