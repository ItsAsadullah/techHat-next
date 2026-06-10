import { Metadata } from 'next';
import { Scale, AlertCircle, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | TechHat',
  description: 'Terms of Service and Conditions for TechHat.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-linear-to-r from-slate-800 to-slate-900 px-8 py-12 text-center">
          <Scale className="w-16 h-16 text-white/90 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-300 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 prose prose-slate dark:prose-invert max-w-none">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-8 border border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 m-0">
              Welcome to <strong>TechHat</strong>. By accessing or using our website and services, you agree to comply with and be bound by the following terms and conditions of use. Please read them carefully.
            </p>
          </div>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400" /> 1. Acceptance of Terms
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            By accessing this website, we assume you accept these terms and conditions. Do not continue to use TechHat if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Products and Services</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            TechHat strives to ensure that all product descriptions, images, and prices are accurate. However, errors may occur. If we discover an error in the price of any goods which you have ordered, we will inform you of this as soon as possible and give you the option of reconfirming your order at the correct price or canceling it.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. User Accounts</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 list-disc pl-5">
            <li>You must be at least 18 years of age to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account and password.</li>
            <li>You agree to accept responsibility for all activities that occur under your account.</li>
            <li>We reserve the right to refuse service, terminate accounts, or cancel orders in our sole discretion.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Payment and Pricing</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            All prices are subject to change without notice. We accept various forms of payment including credit/debit cards and mobile banking. Payment must be received in full before goods are dispatched unless explicitly stated otherwise (e.g., Cash on Delivery).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Return and Refund Policy</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Our Return and Refund Policy outlines your rights and obligations when returning a product. Products must be returned in their original condition and packaging. Please contact our support team to initiate a return request.
          </p>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-500" /> 6. Limitation of Liability
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            TechHat and its directors, employees, or affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising out of the use of or inability to use our products or services.
          </p>

          <hr className="my-10 border-gray-200 dark:border-gray-800" />

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            If you have any queries regarding any of our terms, please contact us at support@techhat.com.bd.
          </p>

        </div>
      </div>
    </div>
  );
}
