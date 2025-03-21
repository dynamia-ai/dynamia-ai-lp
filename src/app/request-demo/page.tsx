"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';
import FormSuccessMessage from '@/components/FormSuccessMessage';
import { isCompanyEmail } from '@/utils/validation';

export default function RequestDemo() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    jobTitle: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证是否为公司邮箱
    if (!isCompanyEmail(formState.email)) {
      alert(t('common.useCompanyEmail'));
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Prepare email content
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add email subject
      formData.append('_subject', `Demo Request - ${formState.company}`);
      
      // Specify the target email
      formData.append('_replyto', formState.email);
      
      // Add hidden fields for FormSubmit configuration
      formData.append('_next', typeof window !== 'undefined' ? window.location.href : '');
      formData.append('_captcha', 'true');
      formData.append('_template', 'box');
      
      // Send to FormSubmit service
      const response = await fetch('https://formsubmit.co/07d5707466ec1e05a458f1f26a8acda2', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Reset form
        setFormState({
          name: '',
          email: '',
          company: '',
          jobTitle: '',
          message: ''
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
  
  // 获取演示内容并确保类型安全
  const demoItemsFromTranslation = t('requestDemo.demoContent.items', { returnObjects: true });
  const demoItems: string[] = Array.isArray(demoItemsFromTranslation)
    ? demoItemsFromTranslation
    : [
        "Overview of kantaloupe platform features",
        "Customized demonstration tailored to your needs",
        "Interactive session with our solution experts",
        "Detailed exploration of deployment options and pricing"
      ];

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {t('requestDemo.title')}
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                {t('requestDemo.subtitle')}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="bg-primary-lighter rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('requestDemo.demoContent.title')}</h2>
                <ul className="space-y-4">
                  {demoItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('requestDemo.form.title')}</h2>
                
                {submitStatus === 'success' && (
                  <FormSuccessMessage translationKey="requestDemo.form.submitSuccess" />
                )}
                
                {submitStatus === 'error' && (
                  <FormSuccessMessage translationKey="requestDemo.form.submitError" isError={true} />
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Hidden field for FormSubmit configuration */}
                  <input type="hidden" name="_next" value={typeof window !== 'undefined' ? window.location.href : ''} />
                  <input type="hidden" name="_captcha" value="true" />
                  <input type="hidden" name="_template" value="box" />
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.name')}</label>
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.email')}</label>
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
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.company')}</label>
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
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.jobTitle')}</label>
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
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t('requestDemo.form.message')}</label>
                    <textarea 
                      id="message" 
                      name="message"
                      value={formState.message}
                      onChange={handleInputChange}
                      rows={4} 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    ></textarea>
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? t('requestDemo.form.submitting') : t('requestDemo.form.submitButton')}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-500">
                {t('requestDemo.followUp')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 