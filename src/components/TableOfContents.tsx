'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TocItem } from '@/types/blog';

interface TableOfContentsProps {
  toc: TocItem[];
  className?: string;
}

export default function TableOfContents({ toc, className = '' }: TableOfContentsProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>('');
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (toc.length === 0) return;

    const updateActiveHeading = () => {
      if (isScrollingRef.current) return;

      const viewportHeight = window.innerHeight;
      const targetOffset = 100; // 目标位置（考虑固定头部）
      
      // 找到最接近目标位置的可见标题
      let activeHeadingId: string | null = null;
      let minDistance = Infinity;

      toc.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        
        // 标题必须真正可见：
        // 1. 标题的顶部在视口内（小于视口高度）
        // 2. 标题的底部在目标位置下方（确保标题已经进入视口）
        // 3. 标题的顶部在目标位置上方或接近（确保标题已经显示出来）
        const isTopVisible = rect.top >= targetOffset && rect.top < viewportHeight;
        const isBottomVisible = rect.bottom > targetOffset;
        const isVisible = isTopVisible && isBottomVisible;
        
        if (isVisible) {
          // 计算标题顶部到目标位置的距离
          const distance = rect.top - targetOffset;
          
          // 选择最接近目标位置且在目标位置上方的标题
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance;
            activeHeadingId = heading.id;
          }
        }
      });

      // 如果没找到在目标位置上方的可见标题，找最接近目标位置的可见标题
      if (!activeHeadingId) {
        let closestId: string | null = null;
        let closestDistance = Infinity;

        toc.forEach((heading) => {
          const element = document.getElementById(heading.id);
          if (!element) return;

          const rect = element.getBoundingClientRect();
          
          // 标题必须可见：顶部在视口内，底部在目标位置下方
          if (rect.top < viewportHeight && rect.bottom > targetOffset) {
            const distance = Math.abs(rect.top - targetOffset);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestId = heading.id;
            }
          }
        });

        if (closestId) {
          activeHeadingId = closestId;
        }
      }

      if (activeHeadingId) {
        setActiveId(activeHeadingId);
      }
    };

    // 滚动监听，更新当前高亮的标题
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateActiveHeading();
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 初始更新一次
    updateActiveHeading();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [toc]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // 立即设置目标 ID 为活跃状态，避免中间项被高亮
      setActiveId(id);
      isScrollingRef.current = true;

      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // 滚动结束后，允许滚动监听器更新高亮
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  };

  if (toc.length === 0) {
    return null;
  }

  return (
    <nav className={`sticky top-24 ${className}`}>
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          {t('resources.blog.tableOfContents')}
        </h2>
        <ul className="space-y-1.5">
          {toc.map((heading, index) => (
            <li key={heading.id || `heading-${index}`}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={`block text-sm transition-colors duration-200 ${
                  heading.level === 1
                    ? 'pl-0 font-medium'
                    : heading.level === 2
                    ? 'pl-4'
                    : heading.level === 3
                    ? 'pl-8'
                    : 'pl-12'
                } ${
                  activeId === heading.id
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

