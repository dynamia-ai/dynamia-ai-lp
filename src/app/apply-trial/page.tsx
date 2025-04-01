"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';
import FormSuccessMessage from '@/components/FormSuccessMessage';
import { isCompanyEmail } from '@/utils/validation';

export default function FreeTrial() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    useCase: '',
    acceptTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormState(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.acceptTerms) {
      alert(t('freeTrial.form.termsRequired'));
      return;
    }
    
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
        if (key !== 'acceptTerms') {
          formData.append(key, value.toString());
        }
      });
      
      // Add email subject
      formData.append('_subject', `Trial Application - ${formState.company}`);
      
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
          phone: formState.phone,
          useCase: formState.useCase,
          _subject: `Trial Application - ${formState.company}`,
          _replyto: formState.email
        })
      });
      
      if (response.ok) {
        // Reset form
        setFormState({
          name: '',
          email: '',
          company: '',
          phone: '',
          useCase: '',
          acceptTerms: false
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
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('freeTrial.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              {t('freeTrial.subtitle')}
            </p>
          </div>

          <div className="mt-12 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
            {submitStatus === 'success' && (
              <FormSuccessMessage translationKey="freeTrial.form.submitSuccess" />
            )}
            
            {submitStatus === 'error' && (
              <FormSuccessMessage translationKey="freeTrial.form.submitError" isError={true} />
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden field for FormSubmit configuration */}
              <input type="hidden" name="_next" value={typeof window !== 'undefined' ? window.location.href : ''} />
              <input type="hidden" name="_captcha" value="true" />
              <input type="hidden" name="_template" value="box" />
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.name')}</label>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.email')}</label>
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
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.company')}</label>
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.phone')}</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formState.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" 
                />
              </div>
              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-gray-700">{t('freeTrial.form.useCase')}</label>
                <textarea 
                  id="useCase" 
                  name="useCase"
                  value={formState.useCase}
                  onChange={handleInputChange}
                  rows={4} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                ></textarea>
              </div>
              <div className="flex items-start">
                <input 
                  id="acceptTerms" 
                  name="acceptTerms"
                  checked={formState.acceptTerms}
                  onChange={handleInputChange}
                  type="checkbox" 
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" 
                  required
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-500">
                  {t('freeTrial.form.terms')}
                </label>
              </div>
              <div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? t('freeTrial.form.submitting') : t('freeTrial.form.submitButton')}
                </button>
              </div>
            </form>
          </div>

          {/* <div className="mt-8 text-center text-sm text-gray-500">
            <p>{t('freeTrial.disclaimer')}</p>
          </div> */}
        </div>
      </div>
    </MainLayout>
  );
} 