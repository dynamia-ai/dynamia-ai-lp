'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import FeatureComparisonTable from '@/components/FeatureComparisonTable';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';
import FormSuccessMessage from '@/components/FormSuccessMessage';
import { isCompanyEmail } from '@/utils/validation';

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// 公司/客户Logo数组
// const companies = [
//   { name: 'Company 1', logo: '/logos/company1.svg' },
//   { name: 'Company 2', logo: '/logos/company2.png' },
//   { name: 'Company 3', logo: '/logos/company3.svg' },
//   { name: 'Company 4', logo: '/logos/company4.svg' },
//   { name: 'Company 5', logo: '/logos/company5.svg' },
//   { name: 'Company 6', logo: '/logos/company6.png' },
// ];

export default function PricingPage() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    jobTitle: '',
    nodeCount: '10-50',
    gpuCount: '1-10',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    // 验证是否为公司邮箱
    if (!isCompanyEmail(formState.email)) {
      alert(t('common.useCompanyEmail'));
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Prepare email content
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add email subject
      formData.append('_subject', `New Pricing Inquiry - ${formState.company}`);
      
      // Specify the target email
      formData.append('_replyto', formState.email);
      
      // Add hidden fields for FormSubmit configuration
      formData.append('_next', typeof window !== 'undefined' ? window.location.href : '');
      formData.append('_captcha', 'true');
      formData.append('_template', 'box');
      
      // Send to API route using Resend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          company: formState.company,
          jobTitle: formState.jobTitle,
          nodeCount: formState.nodeCount,
          gpuCount: formState.gpuCount,
          message: formState.message,
          _subject: `New Pricing Inquiry - ${formState.company}`,
          _replyto: formState.email
        })
      });
      
      if (response.ok) {
        // Reset form
        setFormState({
          name: '',
          email: '',
          company: '',
          jobTitle: '',
          nodeCount: '10-50',
          gpuCount: '1-10',
          message: '',
        });
        setSubmitStatus('success');
      } else {
        console.error('Form submission failed:', await response.text());
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* 页面顶部区域 */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              {t('pricing.title')}
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* 左侧内容区域 */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('pricing.headline')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('pricing.description')}
              </p>
              <div className="space-y-4">
                {(function() {
                  const benefits = t('pricing.benefits', { returnObjects: true });
                  return Array.isArray(benefits) 
                    ? benefits 
                    : ['定制化定价方案', '根据您的集群规模灵活调整', '专业技术支持', '持续的功能更新和升级'];
                }()).map((benefit: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="ml-3 text-base text-gray-600">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧联系表单 */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('pricing.form.title')}</h3>
              
              {submitStatus === 'success' && (
                <FormSuccessMessage translationKey="pricing.form.submitSuccess" />
              )}
              
              {submitStatus === 'error' && (
                <FormSuccessMessage translationKey="pricing.form.submitError" isError={true} />
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hidden field for FormSubmit configuration */}
                <input type="hidden" name="_next" value={typeof window !== 'undefined' ? window.location.href : ''} />
                <input type="hidden" name="_captcha" value="true" />
                <input type="hidden" name="_template" value="box" />
                
                {/* 节点数量和GPU数量放在同一行 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nodeCount" className="block text-sm font-medium text-gray-700">
                      {t('pricing.form.nodeCount')}
                    </label>
                    <select
                      id="nodeCount"
                      name="nodeCount"
                      value={formState.nodeCount}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    >
                      <option value="<10">{t('pricing.form.nodeCountOptions.small')}</option>
                      <option value="10-50">{t('pricing.form.nodeCountOptions.medium')}</option>
                      <option value="50-200">{t('pricing.form.nodeCountOptions.large')}</option>
                      <option value=">200">{t('pricing.form.nodeCountOptions.enterprise')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="gpuCount" className="block text-sm font-medium text-gray-700">
                      {t('pricing.form.gpuCount')}
                    </label>
                    <select
                      id="gpuCount"
                      name="gpuCount"
                      value={formState.gpuCount}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    >
                      <option value="1-10">{t('pricing.form.gpuCountOptions.small')}</option>
                      <option value="10-50">{t('pricing.form.gpuCountOptions.medium')}</option>
                      <option value="50-200">{t('pricing.form.gpuCountOptions.large')}</option>
                      <option value=">200">{t('pricing.form.gpuCountOptions.enterprise')}</option>
                    </select>
                  </div>
                </div>
                
                {/* 姓名和电子邮箱放在同一行 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      {t('pricing.form.name')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      {t('pricing.form.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                
                {/* 公司名称和职位放在同一行 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      {t('pricing.form.company')}
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formState.company}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                      {t('pricing.form.jobTitle')}
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formState.jobTitle}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    {t('pricing.form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formState.message}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? t('pricing.form.submitting') : t('pricing.form.submitButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 特性对比表格区域 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <FeatureComparisonTable />
          </motion.div>
        </div>
      </section>

      {/* 客户信任展示区域 
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('pricing.trustedBy.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('pricing.trustedBy.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            {companies.map((company, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-center h-20 bg-white rounded-lg shadow-sm p-4"
              >
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={200}
                  height={40}
                  className="object-contain max-h-20"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>*/}
    </MainLayout>
  );
} 