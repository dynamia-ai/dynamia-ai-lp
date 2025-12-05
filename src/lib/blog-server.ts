import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { cache } from 'react';
import { BlogPost, BlogPostMeta, BlogPostsResult, TocItem } from '@/types/blog';

const CONTENT_PATH = path.join(process.cwd(), 'src/content/blog');

// Get all blog post directories
export function getBlogPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_PATH)) {
    return [];
  }
  
  const slugs = fs.readdirSync(CONTENT_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  return slugs;
}

// Get blog post by slug and language
export function getBlogPost(slug: string, language: 'en' | 'zh' = 'en'): BlogPost | null {
  try {
    const fullPath = path.join(CONTENT_PATH, slug, `${language}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      excerpt: data.excerpt || '',
      author: data.author || '',
      tags: data.tags || [],
      coverImage: data.coverImage,
      coverTitle: data.coverTitle, // 自定义封面标题
      language: data.language || language,
      content,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

// 仅获取博客文章元数据（不读取完整内容，优化列表页性能）
function getBlogPostMeta(slug: string, language: 'en' | 'zh' = 'en'): BlogPostMeta | null {
  try {
    const fullPath = path.join(CONTENT_PATH, slug, `${language}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    // 读取文件内容（matter 需要读取整个文件来解析 frontmatter）
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents, {
      // 不提取 excerpt，只解析 frontmatter
      excerpt: false,
    });

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      excerpt: data.excerpt || '',
      author: data.author || '',
      tags: data.tags || [],
      coverImage: data.coverImage,
      coverTitle: data.coverTitle,
      language: data.language || language,
    };
  } catch (error) {
    console.error(`Error reading blog post meta ${slug}:`, error);
    return null;
  }
}

// 获取所有博客文章元数据和标签（使用缓存优化性能）
export const getAllBlogPosts = cache((language: 'en' | 'zh' = 'en'): BlogPostsResult => {
  const slugs = getBlogPostSlugs();
  const posts: BlogPostMeta[] = [];
  const tags = new Set<string>();
  
  // 需要隐藏的文章 slug 列表
  const hiddenSlugs = ['hello-world'];
  
  for (const slug of slugs) {
    // 跳过需要隐藏的文章
    if (hiddenSlugs.includes(slug)) {
      continue;
    }
    
    const post = getBlogPostMeta(slug, language);
    if (post) {
      posts.push(post);
      // 同时收集标签
      post.tags.forEach(tag => tags.add(tag));
    }
  }
  
  // Sort by date (newest first)
  const sortedPosts = posts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return {
    posts: sortedPosts,
    tags: Array.from(tags).sort(),
  };
});

// 从 Markdown AST 中提取标题（h2-h6）
function extractTocFromAST(ast: any): TocItem[] {
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  function traverse(node: any) {
    // 只提取 h2-h6 标题（h1 是文章标题）
    if (node.type === 'heading' && node.depth >= 2 && node.depth <= 6) {
      // 提取标题文本
      const text = node.children
        .map((child: any) => {
          if (child.type === 'text') return child.value;
          if (child.type === 'code') return child.value;
          if (child.type === 'link') {
            // 处理链接中的文本
            return child.children
              ?.map((c: any) => (c.type === 'text' ? c.value : ''))
              .join('') || '';
          }
          return '';
        })
        .join('')
        .trim();

      if (text) {
        // 生成 ID（与客户端逻辑保持一致）
        let id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');

        if (!id) {
          id = `heading-${toc.length}`;
        }

        // 确保 ID 唯一
        let uniqueId = id;
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          uniqueId = `${id}-${counter}`;
          counter++;
        }
        usedIds.add(uniqueId);

        toc.push({
          id: uniqueId,
          text,
          level: node.depth,
        });
      }
    }

    // 递归遍历子节点
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(ast);
  return toc;
}

// Convert markdown to HTML and extract TOC
export async function markdownToHtml(markdown: string): Promise<{ html: string; toc: TocItem[] }> {
  // 先解析为 AST 以提取目录
  const ast = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .parse(markdown);

  // 提取目录
  const toc = extractTocFromAST(ast);

  // 转换为 HTML
  const htmlResult = await unified()
    .use(remarkParse)
    .use(remarkGfm) // GitHub Flavored Markdown
    .use(remarkBreaks) // Convert line breaks to <br>
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw) // Parse raw HTML in markdown
    .use(rehypeHighlight) // Syntax highlighting
    .use(rehypeStringify)
    .process(markdown);

  let html = htmlResult.toString();

  // 为标题添加 ID（按顺序匹配）
  if (toc.length > 0) {
    // 按顺序处理每个 TOC 项
    toc.forEach((tocItem) => {
      // 匹配标题，支持包含 HTML 标签的内容
      const regex = new RegExp(
        `<h${tocItem.level}([^>]*)>([\\s\\S]*?)</h${tocItem.level}>`,
        'gi'
      );
      
      let found = false;
      html = html.replace(regex, (match, attrs, content) => {
        // 如果已经有 ID 或已经找到匹配项，跳过
        if (attrs.includes('id=') || found) {
          return match;
        }

        // 清理内容中的 HTML 标签，用于匹配
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        const cleanText = tocItem.text.trim();
        
        // 如果内容匹配（完全匹配或包含主要部分），添加 ID
        if (cleanContent === cleanText || 
            (cleanText.length > 10 && cleanContent.includes(cleanText.substring(0, Math.min(20, cleanText.length))))) {
          found = true;
          return `<h${tocItem.level}${attrs} id="${tocItem.id}">${content}</h${tocItem.level}>`;
        }

        return match;
      });
    });
  }

  return {
    html,
    toc,
  };
}

// Get posts by tag
export function getBlogPostsByTag(tag: string, language: 'en' | 'zh' = 'en'): BlogPostMeta[] {
  const { posts } = getAllBlogPosts(language);
  return posts.filter(post => 
    post.tags.some(postTag => 
      postTag.toLowerCase() === tag.toLowerCase()
    )
  );
}

// Format date for display
export function formatDate(dateString: string, language: 'en' | 'zh' = 'en'): string {
  const date = new Date(dateString);
  
  if (language === 'zh') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
} 