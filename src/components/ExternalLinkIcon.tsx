import React from 'react';
import Image from 'next/image';
import { iconFiles } from './HamiIcon';

// 外链图标组件
const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <Image
    src={iconFiles.externalLink}
    alt="external link"
    className={className}
    width={16}
    height={16}
  />
);

export default ExternalLinkIcon; 