import { liteClient as algoliasearch } from 'algoliasearch/lite';

// 初始化 Algolia 客户端
export const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
);

export const indexName = process.env.ALGOLIA_INDEX_NAME || 'dynamia_ai_content'; 