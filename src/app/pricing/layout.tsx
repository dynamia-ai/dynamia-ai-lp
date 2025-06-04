import type { Metadata } from "next";
import { pageMetadata } from "@/utils/seo";

export const metadata: Metadata = pageMetadata.pricing;

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 