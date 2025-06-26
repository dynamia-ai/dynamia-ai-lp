import { getAllBlogPosts } from '@/lib/blog-server';
import BlogListClient from '../../blog/BlogListClient';

export default async function ZhBlogPage() {
  // Get blog posts for both languages
  const enPosts = getAllBlogPosts('en');
  const zhPosts = getAllBlogPosts('zh');

  return <BlogListClient enPosts={enPosts} zhPosts={zhPosts} />;
} 