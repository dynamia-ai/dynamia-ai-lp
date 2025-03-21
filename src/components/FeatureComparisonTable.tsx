import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

interface FeatureProps {
  name: string;
  hamiStatus: string | boolean;
  kantaloupeStatus: boolean;
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

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function FeatureComparisonTable() {
  const { t } = useTranslation();
  
  // 从i18n中获取表格配置
  const featureComparisonData = t('products.kantaloupe.featureComparison', { returnObjects: true }) as FeatureComparisonData;
  
  // 确保数据可用
  if (!featureComparisonData || !featureComparisonData.categories) {
    console.error('Failed to load feature comparison data from i18n');
    return null;
  }
  
  const {
    title,
    subTitle,
    categoryHeader,
    featureHeader,
    openSource,
    enterprise,
    categories
  } = featureComparisonData;
  
  // 渲染状态标记
  const renderStatus = (status: string | boolean) => {
    if (typeof status === 'string' && status.startsWith('✅')) {
      // 显示带备注的状态
      return (
        <div className="flex flex-col items-center">
          <CheckIcon className="h-5 w-5 text-green-500" />
          <span className="text-xs text-gray-500 mt-1 text-center">{status.replace('✅', '').trim()}</span>
        </div>
      );
    } else if (status === true) {
      // 显示勾选图标
      return <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />;
    } else {
      // 显示叉图标
      return <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />;
    }
  };
  
  return (
    <div className="mt-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="text-center max-w-4xl mx-auto mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-600">
          {subTitle}
        </p>
      </motion.div>
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full px-2 lg:px-0"
      >
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-primary-light">
              <tr>
                <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider w-[10%] min-w-[100px]">
                  {categoryHeader}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider w-[50%] min-w-[300px]">
                  {featureHeader}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider w-[22%] min-w-[120px]">
                  {openSource}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider w-[18%] min-w-[120px]">
                  {enterprise}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, categoryIndex) => (
                category.features.map((feature, featureIndex) => (
                  <tr 
                    key={`${categoryIndex}-${featureIndex}`} 
                    className={featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {featureIndex === 0 ? (
                      <td 
                        rowSpan={category.features.length} 
                        className="px-3 py-3 text-sm font-medium text-gray-900 text-center align-middle border-r border-gray-200"
                      >
                        {category.name}
                      </td>
                    ) : null}
                    <td className="px-3 py-3 text-sm text-gray-700 border-r border-gray-200 break-words hyphens-auto">
                      {feature.name}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                      {renderStatus(feature.hamiStatus)}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-700 text-center">
                      {renderStatus(feature.kantaloupeStatus)}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
} 