// Blog post interface
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  coverImage?: string;
  language: 'en' | 'zh';
  content: string;
  readingTime: string;
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
  language: 'en' | 'zh';
  readingTime: string;
} 