"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layout/MainLayout';
import FormSuccessMessage from '@/components/FormSuccessMessage';
import { isCompanyEmail } from '@/utils/validation';

interface TeamMember {
  name: string;
  position: string;
  image: string;
}

// interface Job {
//   title: string;
//   location: string;
//   type: string;
// }

export default function Company() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // 获取愿景点并确保类型安全
  const visionPointsFromTranslation = t('company.about.vision.points', { returnObjects: true });
  const visionPoints: string[] = Array.isArray(visionPointsFromTranslation) 
    ? visionPointsFromTranslation 
    : [
        "Build the world's leading heterogeneous computing management platform",
        "Drive efficient utilization of computing resources, reducing energy waste",
        "Empower organizations to achieve innovation through optimized computing infrastructure"
      ];
  
  // 获取团队成员并确保类型安全
  const teamMembersFromTranslation = t('company.team.members', { returnObjects: true });
  const teamMembers: TeamMember[] = Array.isArray(teamMembersFromTranslation) 
    ? teamMembersFromTranslation 
    : [
        { name: "Xiao Zhang", position: "Founder & CEO", image: "CEO" },
        { name: "Mengxuan Li", position: "Chief Technology Officer", image: "CTO" },
        { name: "Wen Chen", position: "Chief Product Officer", image: "CPO" },
        { name: "Yu Yin", position: "Chief Operating Officer", image: "COO" }
      ];
  
  // 获取工作岗位并确保类型安全
  // const jobsFromTranslation = t('company.careers.jobs', { returnObjects: true });
  // const jobs: Job[] = Array.isArray(jobsFromTranslation) 
  //   ? jobsFromTranslation 
  //   : [
  //       { title: "Senior Software Engineer", location: "Beijing", type: "Full-time" },
  //       { title: "Machine Learning Engineer", location: "Shanghai", type: "Full-time" },
  //       { title: "Product Manager", location: "Remote", type: "Full-time" },
  //       { title: "Solutions Architect", location: "Shenzhen", type: "Full-time" }
  //     ];

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
      formData.append('_subject', `Contact Form Submission - ${formState.name}`);
      
      // Specify the target email
      formData.append('_replyto', formState.email);
      
      // Add hidden fields for FormSubmit configuration
      formData.append('_next', typeof window !== 'undefined' ? window.location.href : '');
      formData.append('_captcha', 'true');
      formData.append('_template', 'box');
      
      // Send to FormSubmit service
      const response = await fetch('https://formsubmit.co/xxxxx', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Reset form
        setFormState({
          name: '',
          email: '',
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

  return (
    <MainLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 关于我们部分 */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('company.about.title')}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('company.about.description')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('company.about.mission.title')}</h2>
              <p className="text-gray-600 mb-6">
                {t('company.about.mission.description1')}
              </p>
              <p className="text-gray-600">
                {t('company.about.mission.description2')}
              </p>
            </div>
            <div className="bg-primary-lighter rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('company.about.vision.title')}</h2>
              <div className="space-y-4">
                {visionPoints.map((point, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 bg-primary-light rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="ml-3 text-gray-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 团队部分 */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('company.team.title')}</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">{member.image}</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.position}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 招聘部分
          <div className="mt-20">
            <div className="bg-primary-lighter rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {t('company.careers.title')}
              </h2>
              <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('company.careers.description')}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {jobs.map((job, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="mr-4">{job.location}</span>
                      <span>{job.type}</span>
                    </div>
                    <Link
                      href={`/company/careers/${job.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-block text-primary hover:text-primary-dark font-medium"
                    >
                      {t('company.careers.applyButton')} &rarr;
                    </Link>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link
                  href="/company/careers"
                  className="inline-flex items-center px-4 py-2 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50"
                >
                  {t('company.careers.viewJobsButton')}
                </Link>
              </div>
            </div>
          </div>*/}

          {/* 联系部分 */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('company.contact.title')}
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-lg text-gray-500">
                {t('company.contact.description')}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('company.contact.title')}</h3>
                  <div className="space-y-4">
                    <p className="flex items-start">
                      <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('company.contact.address')}
                    </p>
                    <p className="flex items-start">
                      <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('company.contact.email')}
                    </p>
                    <p className="flex items-start">
                      <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {t('company.contact.phone')}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('company.contact.formTitle')}</h3>
                
                {submitStatus === 'success' && (
                  <FormSuccessMessage translationKey="company.contact.submitSuccess" />
                )}
                
                {submitStatus === 'error' && (
                  <FormSuccessMessage translationKey="company.contact.submitError" isError={true} />
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Hidden field for FormSubmit configuration */}
                  <input type="hidden" name="_next" value={typeof window !== 'undefined' ? window.location.href : ''} />
                  <input type="hidden" name="_captcha" value="true" />
                  <input type="hidden" name="_template" value="box" />
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      {t('company.contact.nameLabel')}
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
                      {t('company.contact.emailLabel')}
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
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      {t('company.contact.messageLabel')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? t('company.contact.submitting') : t('company.contact.submitButton')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 