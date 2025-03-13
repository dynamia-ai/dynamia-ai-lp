import React from 'react';

// 图标类型
export type IconName = 'infoCircle' | 'globe' | 'code' | 'users';

// 图标路径映射
export const iconFiles: Record<IconName, string> = {
  infoCircle: "/icons/info-circle.svg",
  globe: "/icons/globe.svg",
  code: "/icons/code.svg",
  users: "/icons/users.svg"
};

// HAMi菜单图标组件
const HamiIcon: React.FC<{ iconName: IconName, className?: string }> = ({ iconName, className = "h-6 w-6" }) => (
  <div className="rounded-md bg-primary-light p-2 inline-flex items-center justify-center">
    {/* 使用img标签而不是next/image来显示SVG，避免Image组件对SVG的处理问题 */}
    <img
      src={iconFiles[iconName]}
      alt={`${iconName} icon`}
      className={className}
      width={24}
      height={24}
    />
  </div>
);

export default HamiIcon; 