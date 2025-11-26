'use client';

import Image from 'next/image';

const BACKGROUND_IMAGE = '/images/blog/blog-cover-background.png';

interface DynamicBlogCoverProps {
  title: string;
  className?: string;
  variant?: 'list' | 'detail';
}

/**
 * 博客封面图组件 - 使用统一的蓝色背景图 + 文字叠加
 */
export default function DynamicBlogCover({
  title,
  className = '',
  variant = 'list',
}: DynamicBlogCoverProps) {

  const titleLines = title.includes('\n')
    ? title.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    : [title.trim()];

  return (
    <div className={`relative w-full h-full ${className} overflow-hidden`}>
      {/* 使用 CSS 背景图，可以立即显示，无需等待加载 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
        }}
      />

      <div className="absolute top-4 left-4 z-10">
        <Image
          src="/LOGO.svg"
          alt=""
          width={160}
          height={40}
          className="opacity-90"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-8 pt-12">
        <h2 className={`text-[#1E3A8A] font-semibold leading-tight ${
          variant === 'detail'
            ? 'text-3xl md:text-4xl lg:text-5xl'
            : 'text-xl md:text-2xl'
        } ${
          titleLines.length === 1 ? 'text-center' : 'text-left'
        }`}>
          {titleLines.map((line: string, index: number) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h2>
      </div>
    </div>
  );
}

