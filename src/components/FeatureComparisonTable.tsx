import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

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

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function FeatureComparisonTable() {
  const { t } = useTranslation();
  
  // 从i18n中获取表格配置
  const featureComparisonData = t('products.kantaloupe.featureComparison', { returnObjects: true }) as FeatureComparisonData;
  
  // 如果翻译数据不可用，使用默认数据
  const defaultComparisonData: FeatureComparisonData = {
    title: "Feature Comparison",
    subTitle: "HAMi (Open Source) vs Kantaloupe (Enterprise) Feature Comparison",
    categoryHeader: "Feature Category",
    featureHeader: "Feature Item",
    openSource: "HAMi Open Source",
    enterprise: "Kantaloupe Enterprise",
    categories: [
      {
        name: "Environment Support",
        features: [
          {
            name: "X86 Environment Support",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Domestic IT Support",
            hami: false,
            kantaloupe: true
          }
        ]
      },
      {
        name: "GPU Kernel Capabilities",
        features: [
          {
            name: "GPU Resource Pooling",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Nvidia GPU Fine-grained Virtualization",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Native nvidia-smi Support",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Gunicorn Multi-task Support (Flask API)",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Video Memory Overcommitment",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Computing Power Overcommitment",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Precise Computing/Memory Limits",
            hami: false,
            kantaloupe: true
          }
        ]
      },
      {
        name: "Scheduling Capabilities",
        features: [
          {
            name: "Node/Card Level Binpack/Spread Scheduling",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Nvidia MIG Support",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Nvidia MIG Dynamic Virtualization",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Nvidia NUMA Affinity Scheduling",
            hami: true,
            kantaloupe: true
          }
        ]
      },
      {
        name: "Monitoring Capabilities",
        features: [
          {
            name: "GPU-Application Binding",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Application Computing/Memory Monitoring",
            hami: true,
            kantaloupe: true
          },
          {
            name: "GPU Fault Metrics/Alerts/Self-recovery",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Idle Resource Alerts",
            hami: false,
            kantaloupe: true
          }
        ]
      },
      {
        name: "Enterprise Features",
        features: [
          {
            name: "GPU Software Stack Management",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Single Cluster GUI",
            hami: true,
            kantaloupe: true
          },
          {
            name: "Metering & Billing System",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Flexible License Management",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Fine-grained Quota Management",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Training & Inference Switching",
            hami: false,
            kantaloupe: true
          },
          {
            name: "Large-scale Scheduling Optimization",
            hami: false,
            kantaloupe: true
          }
        ]
      }
    ]
  };
  
  const categories = featureComparisonData?.categories || defaultComparisonData.categories;
  const title = featureComparisonData?.title || defaultComparisonData.title;
  const subTitle = featureComparisonData?.subTitle || defaultComparisonData.subTitle;
  const categoryHeader = featureComparisonData?.categoryHeader || defaultComparisonData.categoryHeader;
  const featureHeader = featureComparisonData?.featureHeader || defaultComparisonData.featureHeader;
  const openSource = featureComparisonData?.openSource || defaultComparisonData.openSource;
  const enterprise = featureComparisonData?.enterprise || defaultComparisonData.enterprise;
  
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
        className="overflow-x-auto"
      >
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 shadow-md rounded-lg">
          <thead className="bg-primary-light">
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {categoryHeader}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {featureHeader}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {openSource}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider">
                {enterprise}
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
      </motion.div>
    </div>
  );
} 