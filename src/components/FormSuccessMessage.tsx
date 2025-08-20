'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface FormSuccessMessageProps {
  translationKey: string;
  isError?: boolean;
}

/**
 * A component to display form success messages with proper translations
 */
export default function FormSuccessMessage({ translationKey, isError = false }: FormSuccessMessageProps) {
  const { t, i18n } = useTranslation();
  
  // Use fallback messages in case translations fail
  const fallbackMessages = {
    'pricing.form.submitSuccess': {
      en: "Thank you! Your request has been submitted. Our team will contact you shortly with pricing information.",
      zh: "感谢您的提交！我们的团队将很快与您联系，提供定价信息。"
    },
    'pricing.form.submitError': {
      en: "An error occurred while submitting your request. Please try again or contact us directly at info@dynamia.ai.",
      zh: "提交请求时发生错误。请重试或直接联系我们：info@dynamia.ai。"
    }
  };
  
  // Try to get translated text
  const translatedText = t(translationKey);
  
  // Check if translation failed (key returned as-is)
  const translationFailed = translatedText === translationKey;
  
  // If translation failed, use fallback
  const messageToShow = translationFailed 
    ? (fallbackMessages[translationKey as keyof typeof fallbackMessages]?.[i18n.language as 'en' | 'zh'] || translationKey)
    : translatedText;
    
  return (
    <div className={`mb-6 p-4 rounded-md border ${
      isError 
        ? "bg-red-50 text-red-700 border-red-200" 
        : "bg-green-50 text-green-700 border-green-200"
    }`}>
      {messageToShow}
    </div>
  );
} 