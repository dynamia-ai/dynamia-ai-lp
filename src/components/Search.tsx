'use client';

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

// 是否启用搜索功能 - 当前禁用
const SEARCH_ENABLED = false;

const Search: React.FC = () => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  // 如果搜索功能被禁用，显示一个静态的搜索框
  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          placeholder={t('search.placeholder') || '搜索...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!SEARCH_ENABLED}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        {SEARCH_ENABLED && query.length > 0 && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 当搜索被启用后，这里添加搜索结果处理逻辑 */}
    </div>
  );
};

export default Search; 