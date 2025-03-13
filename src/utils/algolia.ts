// Mock implementation for Algolia search client
// Will be replaced with actual implementation when ready to integrate

// 创建一个更完整的mock搜索客户端
export const searchClient = {
  // 基本的Algolia客户端属性
  transporter: {},
  appId: 'mock_app_id',
  apiKey: 'mock_api_key',
  clearCache: () => Promise.resolve(),
  _ua: '',
  addAlgoliaAgent: () => {},
  
  // 缺失的方法
  setClientApiKey: () => {},
  searchForHits: () => Promise.resolve({ hits: [] }),
  searchForFacets: () => Promise.resolve({ facets: [] }),
  customPost: () => Promise.resolve({}),
  getRecommendations: () => Promise.resolve({ results: [] }),
  
  // 核心搜索方法
  search: () => Promise.resolve({ results: [] }),
  searchForFacetValues: () => Promise.resolve([]),
  multipleBatch: () => Promise.resolve({}),
  multipleGetObjects: () => Promise.resolve({}),
  multipleQueries: () => Promise.resolve({ results: [] }),
  copyIndex: () => Promise.resolve({}),
  moveIndex: () => Promise.resolve({}),
  
  // 指数方法
  initIndex: () => ({
    search: () => Promise.resolve({ hits: [] }),
    findObject: () => Promise.resolve(null),
    searchForFacetValues: () => Promise.resolve({ facetHits: [] }),
    browseObjects: () => Promise.resolve({ hits: [] }),
  }),
  
  // 额外方法
  listApiKeys: () => Promise.resolve({ keys: [] }),
  getApiKey: () => Promise.resolve({}),
  addApiKey: () => Promise.resolve({ key: '' }),
  updateApiKey: () => Promise.resolve({}),
  deleteApiKey: () => Promise.resolve({}),
  restoreApiKey: () => Promise.resolve({}),
  getUserID: () => Promise.resolve({}),
  generateSecuredApiKey: () => '',
};

export const indexName = 'mock_index';

// 真实实现的参考代码 - 当准备好集成时取消注释
// import { liteClient as algoliasearch } from 'algoliasearch/lite';
// export const searchClient = algoliasearch(
//   process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
//   process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
// );
// export const indexName = process.env.ALGOLIA_INDEX_NAME || 'dynamia_ai_content'; 