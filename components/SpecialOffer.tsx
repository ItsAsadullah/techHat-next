'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

export default function SpecialOffer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-12 md:px-12 lg:py-16 text-center md:text-left"
        >
          {/* Background Patterns */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-black/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                <span className="animate-pulse">🔥</span> Limited Time Offer
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white mb-4">
                Up to 30% Off on <br /> Smart Devices
              </h2>
              <p className="text-blue-50 text-lg mb-8">
                Upgrade your lifestyle with our premium selection of smart watches, bands, and home automation devices.
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex gap-2 text-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 min-w-[70px]">
                    <span className="block text-2xl font-bold text-white">{timeLeft.hours}</span>
                    <span className="text-xs text-blue-100">Hours</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 min-w-[70px]">
                    <span className="block text-2xl font-bold text-white">{timeLeft.minutes}</span>
                    <span className="text-xs text-blue-100">Mins</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 min-w-[70px]">
                    <span className="block text-2xl font-bold text-white">{timeLeft.seconds}</span>
                    <span className="text-xs text-blue-100">Secs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-2">
                Grab the Deal
                <Timer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
