import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface FeatureProps {
  name: string;
  hami: boolean;
  kantaloupe: boolean;
}

// 定义表格数据结构，用于类型检查
interface FeatureComparisonData {
  title: string;
  subTitle: string;
  categoryHeader: string;
  featureHeader: string;
  categories: {
    name: string;
    features: FeatureProps[];
  }[];
  openSource: string;
  enterprise: string;
}

export default function FeatureComparisonTable() {
  const { t } = useTranslation();
  
  // 从i18n中获取表格配置
  const featureComparisonData = t('products.kantaloupe.featureComparison', { returnObjects: true }) as FeatureComparisonData;
  const categories = featureComparisonData.categories || [];
  
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        {featureComparisonData.title || '功能对比'}
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 shadow-md rounded-lg">
          <thead className="bg-primary-light">
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {featureComparisonData.categoryHeader || '功能类别'}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {featureComparisonData.featureHeader || '功能项'}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {featureComparisonData.openSource || 'HAMi 开源版'}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {featureComparisonData.enterprise || 'Kantaloupe 企业版'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(categories) && categories.map((category, categoryIndex) => (
              Array.isArray(category.features) && category.features.map((feature, featureIndex) => (
                <tr 
                  key={`${categoryIndex}-${featureIndex}`} 
                  className="bg-white hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* 只在每个类别的第一个特性行显示类别名称 */}
                  {featureIndex === 0 ? (
                    <td 
                      rowSpan={category.features.length} 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center align-middle border-r border-gray-200"
                    >
                      {category.name}
                    </td>
                  ) : null}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feature.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {feature.hami ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {feature.kantaloupe ? (
                      <CheckIcon className="h-5 w-5 text-primary mx-auto" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 