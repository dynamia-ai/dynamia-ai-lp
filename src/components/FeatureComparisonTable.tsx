import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface FeatureProps {
  name: string;
  hamiStatus: string | boolean;
  kantaloupeStatus: string | boolean;
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load feature comparison data from i18n');
    }
    return null;
  }
  
  const {
    title,
    categoryHeader,
    featureHeader,
    openSource,
    enterprise,
    categories
  } = featureComparisonData;
  
  // 渲染状态标记
  const renderStatus = (status: string | boolean) => {
    if (typeof status === 'string') {
      const trimmedStatus = status.trim();

      if (trimmedStatus.startsWith('✅')) {
        const note = trimmedStatus.replace('✅', '').trim();

        return (
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-primary p-1 w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {note ? (
              <span className="text-xs text-gray-500 mt-1 text-center">
                {note}
              </span>
            ) : null}
          </div>
        );
      }

      return (
        <div className="text-sm font-semibold text-gray-900 text-center">
          {trimmedStatus}
        </div>
      );
    }

    if (status === true) {
      return (
        <div className="rounded-full bg-primary p-1 w-5 h-5 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="rounded-full bg-gray-400 p-1 w-5 h-5 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M6 18L18 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
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
            <thead className="bg-primary">
              <tr>
                <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider w-[22%] min-w-[100px]">
                  {categoryHeader}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider w-[38%] min-w-[300px]">
                  {featureHeader}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-md font-black text-white uppercase tracking-wider w-[22%] min-w-[120px]">
                  {openSource}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-md font-black text-white uppercase tracking-wider w-[18%] min-w-[120px]">
                  {enterprise}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, categoryIndex) => (
                category.features.map((feature, featureIndex) => (
                  <tr 
                    key={`${categoryIndex}-${featureIndex}`} 
                  >
                    {featureIndex === 0 ? (
                      <td 
                        rowSpan={category.features.length} 
                        className="px-3 py-3 bg-gray-50 text-md font-extrabold text-center align-middle border-r border-gray-200"
                      >
                        {category.name}
                      </td>
                    ) : null}
                    <td className="pl-5 pr-3 text-center text-md font-bold border-r border-gray-200 break-words hyphens-auto">
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
