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
import readingTime from 'reading-time';
import { BlogPost, BlogPostMeta } from '@/types/blog';

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

    // Calculate reading time
    const stats = readingTime(content);

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      excerpt: data.excerpt || '',
      author: data.author || '',
      tags: data.tags || [],
      coverImage: data.coverImage,
      language: data.language || language,
      content,
      readingTime: stats.text,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

// Get all blog posts metadata
export function getAllBlogPosts(language: 'en' | 'zh' = 'en'): BlogPostMeta[] {
  const slugs = getBlogPostSlugs();
  const posts: BlogPostMeta[] = [];
  
  for (const slug of slugs) {
    const post = getBlogPost(slug, language);
    if (post) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content, ...meta } = post;
      posts.push(meta);
    }
  }
  
  // Sort by date (newest first)
  return posts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// Convert markdown to HTML
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm) // GitHub Flavored Markdown
    .use(remarkBreaks) // Convert line breaks to <br>
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw) // Parse raw HTML in markdown
    .use(rehypeHighlight) // Syntax highlighting
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

// Get posts by tag
export function getBlogPostsByTag(tag: string, language: 'en' | 'zh' = 'en'): BlogPostMeta[] {
  const allPosts = getAllBlogPosts(language);
  return allPosts.filter(post => 
    post.tags.some(postTag => 
      postTag.toLowerCase() === tag.toLowerCase()
    )
  );
}

// Get all unique tags
export function getAllTags(language: 'en' | 'zh' = 'en'): string[] {
  const allPosts = getAllBlogPosts(language);
  const tags = new Set<string>();
  
  allPosts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
  });
  
  return Array.from(tags).sort();
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