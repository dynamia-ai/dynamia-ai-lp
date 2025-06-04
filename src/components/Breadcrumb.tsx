import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const { t } = useTranslation();

  return (
    <nav aria-label="Breadcrumb" className="flex" itemScope itemType="https://schema.org/BreadcrumbList">
      <ol className="flex items-center space-x-2">
        {/* Home link */}
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link 
            href="/" 
            className="text-gray-400 hover:text-gray-500 flex items-center"
            itemProp="item"
          >
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only" itemProp="name">{t('navigation.home')}</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            {item.href ? (
              <Link 
                href={item.href} 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className="text-gray-900 text-sm font-medium" itemProp="name">
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 