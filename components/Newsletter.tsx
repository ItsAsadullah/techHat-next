'use client';

import { Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-gray-900 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          {/* Decor */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-gray-900 to-gray-900" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get the latest tech deals in your inbox
            </h2>
            <p className="text-gray-400 mb-8">
              Subscribe to our newsletter and be the first to know about new arrivals, special offers, and exclusive tech tips.
            </p>

            <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit"
                className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {status === 'success' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Subscribed
                  </>
                ) : (
                  <>
                    Subscribe <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 flex items-center justify-center gap-2">
              <input type="checkbox" id="gdpr" className="rounded border-gray-600 bg-transparent text-blue-600 focus:ring-offset-gray-900" required />
              <label htmlFor="gdpr" className="text-xs text-gray-500">
                I agree to the <a href="#" className="underline hover:text-white">Privacy Policy</a> and terms.
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
