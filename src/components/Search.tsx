'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createAutocomplete } from '@algolia/autocomplete-core';
import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia';
import { searchClient, indexName } from '@/utils/algolia';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

// 搜索结果项的类型定义
type SearchResultItem = {
  objectID: string;
  title: string;
  content: string;
  path: string;
  locale?: string;
};

type AutocompleteCollection = {
  source: {
    sourceId: string;
  };
  items: SearchResultItem[];
};

type AutocompleteState = {
  collections: AutocompleteCollection[];
  isOpen: boolean;
};

const Search: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>({
    collections: [],
    isOpen: false,
  });
  const [query, setQuery] = useState('');

  // 创建 Algolia Autocomplete 实例
  const autocomplete = React.useMemo(
    () =>
      createAutocomplete<SearchResultItem>({
        onStateChange({ state }) {
          setAutocompleteState({
            collections: state.collections as AutocompleteCollection[],
            isOpen: state.isOpen,
          });
        },
        getSources() {
          return [
            {
              sourceId: 'products',
              getItems({ query }) {
                return getAlgoliaResults({
                  searchClient,
                  queries: [
                    {
                      indexName,
                      query: query,
                      params: {
                        hitsPerPage: 5,
                        attributesToSnippet: ['content:10'],
                        snippetEllipsisText: '...',
                      } as any,
                    } as any,
                  ],
                });
              },
            },
          ];
        },
      }),
    []
  );

  const { getEnvironmentProps } = autocomplete;

  // 添加键盘事件和点击外部关闭搜索框
  useEffect(() => {
    if (!autocompleteState.isOpen || !inputRef.current) return;

    // 创建必要的元素引用
    const formElement = document.createElement('form');
    const panelElement = document.createElement('div');
    
    const environmentProps = getEnvironmentProps({
      inputElement: inputRef.current,
      formElement,
      panelElement,
    });

    Object.entries(environmentProps).forEach(([key, listener]) => {
      window.addEventListener(key, listener as EventListener);
    });

    return () => {
      Object.entries(environmentProps).forEach(([key, listener]) => {
        window.removeEventListener(key, listener as EventListener);
      });
    };
  }, [autocompleteState.isOpen, getEnvironmentProps]);

  const handleItemClick = (item: SearchResultItem) => {
    router.push(item.path);
    setAutocompleteState((prev) => ({ ...prev, isOpen: false }));
    setQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          placeholder={t('search.placeholder') || '搜索...'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            autocomplete.setQuery(e.target.value);
            if (!autocompleteState.isOpen) {
              autocomplete.setIsOpen(true);
            }
          }}
          onClick={() => autocomplete.setIsOpen(true)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        {query.length > 0 && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => {
              setQuery('');
              autocomplete.setQuery('');
              autocomplete.setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 搜索结果弹出框 */}
      {autocompleteState.isOpen && autocompleteState.collections.length > 0 && autocompleteState.collections[0]?.items?.length > 0 && (
        <div className="absolute z-50 mt-2 w-full sm:w-96 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {autocompleteState.collections[0].items.map((item: SearchResultItem) => (
              <div
                key={item.objectID}
                className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleItemClick(item)}
              >
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500 mt-1">{item.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 无搜索结果提示 */}
      {autocompleteState.isOpen && query.length > 0 && (!autocompleteState.collections.length || !autocompleteState.collections[0]?.items?.length) && (
        <div className="absolute z-50 mt-2 w-full sm:w-96 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-3 text-sm text-gray-500">
            {t('search.noResults') || '没有找到相关结果'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search; 