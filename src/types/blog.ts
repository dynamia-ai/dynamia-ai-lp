// 目录项接口
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Blog post interface
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  coverImage?: string;
  coverTitle?: string; // 自定义封面标题，如果不设置则使用 title
  language: 'en' | 'zh';
  content: string;
  toc?: TocItem[]; // 目录数据（服务器端生成）
}

// Blog post metadata (without content)
export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  coverImage?: string;
  coverTitle?: string; // 自定义封面标题，如果不设置则使用 title
  language: 'en' | 'zh';
}

// Blog posts result with tags
export interface BlogPostsResult {
  posts: BlogPostMeta[];
  tags: string[];
} 