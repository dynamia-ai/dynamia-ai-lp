import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Dynamia AI - HAMi Insights & Tutorials',
  description: 'Explore technical articles, tutorials, and insights about HAMi, GPU virtualization, and heterogeneous computing from the Dynamia AI team.',
  keywords: ['HAMi', 'GPU virtualization', 'heterogeneous computing', 'Kubernetes', 'AI infrastructure', 'blog'],
  openGraph: {
    title: 'Dynamia AI Blog - HAMi & Heterogeneous Computing',
    description: 'Technical insights, tutorials, and updates about HAMi and heterogeneous computing.',
    type: 'website',
    siteName: 'Dynamia AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dynamia AI Blog',
    description: 'Technical insights about HAMi and heterogeneous computing.',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 