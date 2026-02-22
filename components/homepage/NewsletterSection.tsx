'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && agreed) {
      // TODO: Integrate with newsletter service
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-10 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl px-6 sm:px-10 lg:px-16 py-12 sm:py-14 lg:py-16">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/20 rounded-2xl mb-6">
              <Mail className="w-7 h-7 text-blue-400" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3">
              Stay Updated
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-md mx-auto">
              Subscribe to our newsletter for exclusive deals, new arrivals, and insider-only discounts.
            </p>

            {submitted ? (
              <div className="flex items-center justify-center gap-3 text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-lg font-medium">Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-5 py-3.5 bg-white/10 border border-white/10 rounded-full text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!agreed}
                    className={cn(
                      'px-7 py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2',
                      agreed
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    Subscribe
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <label className="flex items-center justify-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400">
                    I agree to receive marketing emails. Unsubscribe anytime.
                  </span>
                </label>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
