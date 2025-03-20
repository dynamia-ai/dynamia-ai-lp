import React from 'react';
import Image from 'next/image';

// 图标类型
export type IconName = 'infoCircle' | 'globe' | 'code' | 'users' | 'document' | 'blog' | 'externalLink';

// 图标路径映射
export const iconFiles: Record<IconName, string> = {
  infoCircle: "/icons/info-circle.svg",
  globe: "/icons/globe.svg",
  code: "/icons/code.svg",
  users: "/icons/users.svg",
  document: "/icons/document.svg",
  blog: "/icons/blog.svg",
  externalLink: "/icons/external-link.svg"
};

// HAMi菜单图标组件
const HamiIcon: React.FC<{ iconName: IconName, className?: string }> = ({ iconName, className = "h-6 w-6" }) => (
  <div className="rounded-md bg-primary-light p-2 inline-flex items-center justify-center">
    {/* 使用Next.js Image组件 */}
    <Image
      src={iconFiles[iconName]}
      alt={`${iconName} icon`}
      className={className}
      width={24}
      height={24}
    />
  </div>
);

export default HamiIcon;