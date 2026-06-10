import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | TechHat',
  description: 'Privacy Policy and User Data Deletion details for TechHat.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-8 py-12 text-center">
          <ShieldCheck className="w-16 h-16 text-white/90 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
          <p className="text-blue-100 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 prose prose-blue dark:prose-invert max-w-none">
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-8 border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 m-0">
              At <strong>TechHat</strong>, we are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, and protect your data.
            </p>
          </div>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            <Lock className="w-6 h-6 text-blue-600" /> Information We Collect
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            When you visit our website, register for an account, or place an order, we may collect personal information such as your name, email address, phone number, shipping address, and payment details. We also collect non-personal data such as browser type, IP address, and pages visited to improve our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">How We Use Your Information</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 list-disc pl-5">
            <li>To process and fulfill your orders.</li>
            <li>To communicate with you regarding your purchases or inquiries.</li>
            <li>To personalize your shopping experience.</li>
            <li>To improve our website functionality and customer service.</li>
            <li>To send promotional emails (only if you have opted in).</li>
          </ul>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            <Trash2 className="w-6 h-6 text-red-500" /> User Data Deletion Instructions
          </h2>
          <div className="p-5 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 rounded-r-xl">
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
              We respect your right to manage your personal data. If you wish to delete your account or any personal data associated with it (including data collected via Facebook or Google login), you can do so by following these steps:
            </p>
            <ol className="space-y-3 text-gray-600 dark:text-gray-400 list-decimal pl-5">
              <li>Log in to your TechHat account.</li>
              <li>Navigate to your <strong>Account Settings</strong> or <strong>Profile</strong> dashboard.</li>
              <li>Locate the <strong>Delete Account</strong> option and confirm your request.</li>
              <li>Alternatively, you can email us directly at <a href="mailto:privacy@techhat.com.bd" className="text-blue-600 font-semibold hover:underline">privacy@techhat.com.bd</a> with the subject line "Data Deletion Request". We will process your request within 48 hours and remove all your personal information from our active databases.</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Third-Party Services</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We use third-party services for payment processing, analytics, and social logins (such as Google and Facebook). These third parties have their own privacy policies governing how they use your data. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Security</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We implement a variety of security measures to maintain the safety of your personal information. All sensitive payment data is transmitted via Secure Socket Layer (SSL) technology and encrypted.
          </p>

          <hr className="my-10 border-gray-200 dark:border-gray-800" />

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Have Questions?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">If you have any questions about this Privacy Policy, please contact us.</p>
            </div>
            <a href="mailto:support@techhat.com.bd" className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Mail className="w-4 h-4" /> Contact Support
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
