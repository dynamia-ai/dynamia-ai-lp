import { getAllBlogPosts } from '@/lib/blog-server';
import BlogListClient from './BlogListClient';

export default async function BlogPage() {
  // Get blog posts for both languages
  const enPosts = getAllBlogPosts('en');
  const zhPosts = getAllBlogPosts('zh');

  return <BlogListClient enPosts={enPosts} zhPosts={zhPosts} />;
} 