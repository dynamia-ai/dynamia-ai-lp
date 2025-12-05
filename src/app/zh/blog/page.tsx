import { getAllBlogPosts } from '@/lib/blog-server';
import BlogListClient from '../../blog/BlogListClient';

export default async function ZhBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  
  // 获取两种语言的博客文章和标签（一次调用，带缓存）
  const enResult = getAllBlogPosts('en');
  const zhResult = getAllBlogPosts('zh');

  return (
    <BlogListClient 
      enPosts={enResult.posts} 
      zhPosts={zhResult.posts}
      enTags={enResult.tags}
      zhTags={zhResult.tags}
      selectedTag={tag}
    />
  );
} 