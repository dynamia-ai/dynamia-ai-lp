import type { Metadata } from "next";
import { faqSchema } from "@/components/StructuredData";

const faqs = [
  {
    question: "What is Dynamia AI?",
    answer: "Dynamia AI is an enterprise-grade heterogeneous computing platform built on HAMi technology. It provides GPU sharing, auto-scaling, and unified management for AI workloads, enabling organizations to maximize their computing resource utilization."
  },
  {
    question: "What is HAMi?",
    answer: "HAMi (Heterogeneous AI Computing Middleware) is an open-source project and CNCF Sandbox project that provides GPU virtualization and resource management capabilities. It's the core technology behind Dynamia AI's enterprise platform."
  },
  {
    question: "How does GPU sharing work?",
    answer: "Dynamia AI dynamically consolidates and orchestrates GPU resources, allowing multiple workloads to share GPU memory and compute resources efficiently. This eliminates waste, maximizes resource utilization, and reduces operational costs."
  },
  {
    question: "What types of workloads does Dynamia AI support?",
    answer: "Dynamia AI supports AI/ML training and inference, high-performance computing (HPC), edge computing, and various other computational workloads that require GPU acceleration."
  },
  {
    question: "Is Dynamia AI compatible with Kubernetes?",
    answer: "Yes, Dynamia AI is built for Kubernetes environments and integrates seamlessly with existing Kubernetes clusters. It provides enhanced scheduling and resource management capabilities on top of Kubernetes."
  },
  {
    question: "How is pricing determined?",
    answer: "Dynamia AI offers flexible pricing based on your cluster size, number of nodes, and GPU count. We provide customized pricing plans that scale with your infrastructure needs. Contact us for a detailed quote."
  },
  {
    question: "What support is included?",
    answer: "Enterprise customers receive professional technical support, including setup assistance, troubleshooting, best practices guidance, and continuous updates and maintenance."
  },
  {
    question: "Can I try Dynamia AI before purchasing?",
    answer: "Yes, we offer free trials for qualified organizations. You can apply for a trial through our website to evaluate Dynamia AI in your environment before making a commitment."
  }
];

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Dynamia AI",
  description: "Find answers to frequently asked questions about Dynamia AI, HAMi, GPU virtualization, pricing, and technical support. Learn more about our heterogeneous computing platform.",
  keywords: "dynamia ai faq, HAMi questions, GPU virtualization FAQ, heterogeneous computing questions",
  openGraph: {
    title: "FAQ - Frequently Asked Questions | Dynamia AI",
    description: "Find answers to frequently asked questions about Dynamia AI, HAMi, GPU virtualization, and our enterprise platform.",
    url: "/faq",
    siteName: "Dynamia AI",
    type: "website",
  },
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Find answers to common questions about Dynamia AI and our heterogeneous computing platform.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {faq.question}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our team is here to help. Contact us for more information or to schedule a demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/request-demo"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              Request Demo
            </a>
            <a
              href="mailto:info@dynamia.ai"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema(faqs))
        }}
      />
    </div>
  );
} 