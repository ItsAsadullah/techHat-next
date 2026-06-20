import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, PackageOpen } from 'lucide-react';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-8 rounded-full mb-8 shadow-sm">
          <PackageOpen className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-300 mb-4">
          Oops! Page not found.
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
          The product or page you are looking for might have been moved, deleted, or possibly never existed in the first place.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 shadow-md hover:shadow-lg transition-all">
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-full px-8 bg-white dark:bg-transparent shadow-sm hover:shadow-md transition-all">
              <Search className="w-4 h-4" /> Browse Products
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
