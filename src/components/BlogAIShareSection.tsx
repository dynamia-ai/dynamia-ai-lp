'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface BlogAIShareSectionProps {
  title: string;
  url: string;
}

export default function BlogAIShareSection({ title, url }: BlogAIShareSectionProps) {
  const { t } = useTranslation();
  const [fullUrl, setFullUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      setFullUrl(currentUrl);
    }
  }, []);

  const displayUrl = fullUrl || (typeof window !== 'undefined' ? window.location.href : url);
  const encodedUrl = encodeURIComponent(displayUrl);
  const encodedTitle = encodeURIComponent(title);

  // 统一的AI提示文本
  const aiPrompt = t('resources.blog.aiShare.aiPrompt', { url: displayUrl });
  const encodedAiPrompt = encodeURIComponent(aiPrompt);

  // AI Platform configuration - ChatGPT放在第一个，顺序与文章顶部保持一致
  const aiPlatforms = [
    {
      key: 'chatgpt',
      icon: '/icons/share/chatgpt.svg',
      bgColor: 'bg-green-100',
      hoverColors: 'hover:border-green-300 hover:bg-green-50',
      url: `https://chat.openai.com/?q=${encodedAiPrompt}`
    },
    {
      key: 'claude',
      icon: '/icons/share/claude.svg',
      bgColor: 'bg-orange-100',
      hoverColors: 'hover:border-orange-300 hover:bg-orange-50',
      url: `https://claude.ai/new?q=${encodedAiPrompt}`
    },
    {
      key: 'deepseek',
      icon: '/icons/share/deepseek.svg',
      bgColor: 'bg-blue-100',
      hoverColors: 'hover:border-blue-300 hover:bg-blue-50',
      url: `https://chat.deepseek.com/?q=${encodedAiPrompt}`
    },
    {
      key: 'gemini',
      icon: '/icons/share/google-ai.svg',
      bgColor: 'bg-purple-100',
      hoverColors: 'hover:border-purple-300 hover:bg-purple-50',
      url: `https://www.google.com/search?udm=50&aep=11&q=${encodedAiPrompt}`
    },
    {
      key: 'perplexity',
      icon: '/icons/share/perplexity.svg',
      bgColor: 'bg-blue-100',
      hoverColors: 'hover:border-blue-300 hover:bg-blue-50',
      url: `https://www.perplexity.ai/search/new?q=${encodedAiPrompt}`
    },
    {
      key: 'grok',
      icon: '/icons/share/grok.svg',
      bgColor: 'bg-gray-100',
      hoverColors: 'hover:border-gray-400 hover:bg-gray-50',
      url: `https://x.com/i/grok?text=${encodedAiPrompt}`
    }
  ];

  // Social platforms - 调整顺序使其与 sealos.io 不同
  const socialPlatforms = [
    {
      key: 'x',
      icon: '/icons/share/x.svg',
      label: 'X',
      hoverColors: 'hover:border-gray-800 hover:bg-gray-50 hover:text-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    },
    {
      key: 'whatsapp',
      icon: '/icons/share/whatsapp.svg',
      label: 'WhatsApp',
      hoverColors: 'hover:border-green-600 hover:bg-green-50 hover:text-green-700',
      url: `https://wa.me/?text=${encodedTitle}+${encodedUrl}`
    },
    {
      key: 'linkedin',
      icon: '/icons/share/linkedin.svg',
      label: 'LinkedIn',
      hoverColors: 'hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }
  ];

  return (
    <>
      {/* Explore with AI Section */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-3">
            <div className="flex items-center gap-3">
              <div className="text-primary flex items-center">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('resources.blog.aiShare.exploreTitle')}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 ml-8">{t('resources.blog.aiShare.exploreSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {aiPlatforms.map((platform) => {
            const toolName = t(`resources.blog.aiShare.aiTools.${platform.key}.name`);
            return (
              <button
                key={platform.key}
                onClick={() => window.open(platform.url, '_blank', 'noopener,noreferrer')}
                className={`group relative flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 text-left transition-all duration-300 ${platform.hoverColors} hover:shadow-lg hover:-translate-y-0.5 hover:border-opacity-100 hover:bg-white`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${platform.bgColor} shadow-sm ring-1 ring-inset ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                  <Image
                    src={platform.icon}
                    alt={toolName}
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 group-hover:text-gray-950 transition-colors">{toolName}</div>
                </div>
                <div className="shrink-0 text-gray-300 group-hover:text-primary transition-colors duration-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Share this article Section */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="text-gray-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-700">{t('resources.blog.aiShare.shareTitle')}</h4>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {socialPlatforms.map((platform) => (
            <button
              key={platform.key}
              onClick={() => window.open(platform.url, '_blank', 'noopener,noreferrer')}
              className={`group inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition-all duration-200 ${platform.hoverColors} hover:shadow-sm hover:-translate-y-0.5`}
            >
              <Image
                src={platform.icon}
                alt={platform.label}
                width={16}
                height={16}
                className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              />
              {platform.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

