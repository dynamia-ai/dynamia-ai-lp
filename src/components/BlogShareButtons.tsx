'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface BlogShareButtonsProps {
  title: string;
  url: string;
}

export default function BlogShareButtons({ title, url }: BlogShareButtonsProps) {
  const { t } = useTranslation();
  const [fullUrl, setFullUrl] = useState<string>('');

  // 在客户端获取完整的URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 确保获取的是当前页面的完整URL
      const currentUrl = window.location.href;
      setFullUrl(currentUrl);
    }
  }, []);

  // 如果还没有获取到URL，使用传入的url参数作为后备
  const displayUrl = fullUrl || url;
  
  const encodedUrl = encodeURIComponent(displayUrl);
  const encodedTitle = encodeURIComponent(title);
  
  // 生成AI提示文本
  const aiPrompt = t('resources.blog.aiShare.aiPrompt', { url: displayUrl });

  const shareButtons: Array<{
    name: string;
    icon: React.ReactNode;
    href: string;
    color: string;
  }> = [
    {
      name: 'ChatGPT',
      icon: (
        <Image 
          src="/icons/share/chatgpt.svg" 
          alt="ChatGPT" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://chat.openai.com/?q=${encodeURIComponent(aiPrompt)}`,
      color: 'text-gray-600'
    },
    {
      name: 'Claude',
      icon: (
        <Image 
          src="/icons/share/claude.svg" 
          alt="Claude" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://claude.ai/new?q=${encodeURIComponent(aiPrompt)}`,
      color: 'text-[#FF6B35]'
    },
    {
      name: 'DeepSeek',
      icon: (
        <Image 
          src="/icons/share/deepseek.svg" 
          alt="DeepSeek" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://chat.deepseek.com/?q=${encodeURIComponent(aiPrompt)}`,
      color: 'text-gray-600'
    },
    {
      name: 'Google AI',
      icon: (
        <Image 
          src="/icons/share/google-ai.svg" 
          alt="Google AI" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://www.google.com/search?udm=50&aep=11&q=${encodeURIComponent(aiPrompt)}`,
      color: 'text-gray-600'
    },
    {
      name: 'Perplexity',
      icon: (
        <Image 
          src="/icons/share/perplexity.svg" 
          alt="Perplexity" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://www.perplexity.ai/search/new?q=${encodeURIComponent(aiPrompt)}`,
      color: 'text-gray-600'
    },
    {
      name: 'Grok',
      icon: (
        <Image 
          src="/icons/share/grok.svg" 
          alt="Grok" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://x.com/i/grok?text=${encodeURIComponent(aiPrompt)}`,
      color: 'text-gray-600'
    },
    {
      name: 'LinkedIn',
      icon: (
        <Image 
          src="/icons/share/linkedin.svg" 
          alt="LinkedIn" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'text-[#0077B5]'
    },
    {
      name: 'X',
      icon: (
        <Image 
          src="/icons/share/x.svg" 
          alt="X" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'text-gray-900'
    },
    {
      name: 'WhatsApp',
      icon: (
        <Image 
          src="/icons/share/whatsapp.svg" 
          alt="WhatsApp" 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      ),
      href: `https://wa.me/?text=${encodedTitle}+${encodedUrl}`,
      color: 'text-[#25D366]'
    }
  ];

  return (
    <div className="mt-6 pb-6 border-b border-gray-200">
      <div className="flex items-start gap-3">
        <span className="text-sm font-medium text-gray-700 pt-1 whitespace-nowrap shrink-0">
          {t('resources.blog.aiShare.shareAt')}
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          {shareButtons.map((button) => (
            <a
              key={button.name}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-xs font-medium"
            >
              <span className={button.color}>
                {button.icon}
              </span>
              <span className="text-gray-700">{button.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

