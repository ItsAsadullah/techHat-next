import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Info } from 'lucide-react';

export default function ProductFormInstructions({ iconOnly }: { iconOnly?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size={iconOnly ? "icon" : "sm"} className={iconOnly ? "h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" : "h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"}>
          <HelpCircle className={iconOnly ? "w-4 h-4" : "w-3.5 h-3.5 mr-1.5"} />
          {!iconOnly && "নির্দেশনা"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl pb-2 border-b">
            <Info className="w-5 h-5 text-blue-500" />
            প্রোডাক্ট ফরম পূরণের নিয়মাবলী
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 text-sm">
          
          {/* Section 1: Product Types */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">১</span>
              প্রোডাক্ট টাইপ (Simple vs Variable)
            </h3>
            <ul className="list-disc pl-10 space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">Simple Product:</strong> যে প্রোডাক্টের কোনো সাইজ, কালার বা অন্য কোনো ভেরিয়েশন নেই। যেমন: একটি মাউস বা একটি বই।</li>
              <li><strong className="text-foreground">Variable Product:</strong> যে প্রোডাক্টের সাইজ, কালার বা বিভিন্ন অপশন থাকে। যেমন: একটি টি-শার্ট (যা লাল, নীল, M, L সাইজের হতে পারে)।</li>
            </ul>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">২</span>
              প্রাইস বা মূল্য কীভাবে কাজ করে?
            </h3>
            <div className="bg-muted/30 p-3 rounded-lg border border-muted ml-8 space-y-2">
              <p><strong>Retail / Online / Wholesale Price:</strong> এগুলো হলো বিক্রয় মূল্য। আপনি যে দামে কাস্টমারের কাছে প্রোডাক্ট বিক্রি করতে চান, সেগুলো এখানে বসাবেন।</p>
              <p><strong>Average Cost (কেনা দাম):</strong> আপনি লক্ষ্য করবেন এখানে Cost Price ম্যানুয়ালি বসানোর কোনো অপশন নেই এবং এটি <strong>"PURCHASE MODULE"</strong> দ্বারা লক করা আছে। কারণ, একটি প্রোডাক্ট আপনি বিভিন্ন সময় বিভিন্ন দামে সাপ্লায়ারের কাছ থেকে কিনতে পারেন। তাই সিস্টেম স্বয়ংক্রিয়ভাবে আপনার কেনা দামের গড় (Average Cost) হিসাব করে এখানে দেখাবে।</p>
            </div>
          </div>

          {/* Section 3: Stock Management */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">৩</span>
              স্টক, সাপ্লায়ার এবং কেনা দাম সেট করার নিয়ম
            </h3>
            <ul className="list-disc pl-10 space-y-1.5 text-muted-foreground">
              <li><strong>প্রথম ধাপ (প্রোডাক্ট তৈরি):</strong> প্রোডাক্ট ফরম থেকে শুধু প্রোডাক্টের নাম, ছবি, ক্যাটাগরি এবং বিক্রয় মূল্য (Retail Price) দিয়ে প্রোডাক্টটি Save করুন।</li>
              <li><strong>দ্বিতীয় ধাপ (Purchase Order):</strong> প্রোডাক্ট তৈরি হওয়ার পর, অ্যাডমিন প্যানেল থেকে <strong>Purchases</strong> মেনুতে যান। সেখানে নতুন একটি Purchase Order (PO) তৈরি করুন।</li>
              <li><strong>তৃতীয় ধাপ (সাপ্লায়ার ও কেনা দাম):</strong> Purchase Order-এর ভেতরে আপনি <strong>Supplier</strong> সিলেক্ট করবেন, প্রোডাক্টটি সিলেক্ট করবেন এবং সেখানে আপনি <strong>কত পিস কিনেছেন (Qty)</strong> এবং <strong>কত দামে কিনেছেন (Unit Cost)</strong> তা লিখে রিসিভ করবেন।</li>
              <li><strong>ফলাফল:</strong> Purchase Order রিসিভ হওয়ার সাথে সাথেই আপনার প্রোডাক্টের স্টক অটোমেটিক বেড়ে যাবে এবং Average Cost (কেনা দাম) আপডেট হয়ে প্রোডাক্ট পেজে শো করবে!</li>
            </ul>
          </div>

          {/* Section 4: Variants & Attributes */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">৪</span>
              ভেরিয়েন্ট কীভাবে তৈরি করবেন?
            </h3>
            <ol className="list-decimal pl-10 space-y-1.5 text-muted-foreground">
              <li>প্রথমে <strong>"Variable Product"</strong> সিলেক্ট করুন।</li>
              <li>এরপর <strong>"Global Attributes"</strong> থেকে ড্রপডাউন ব্যবহার করে আপনার প্রয়োজনীয় অ্যাট্রিবিউট (যেমন: Color, RAM, Size) সিলেক্ট করুন।</li>
              <li>অ্যাট্রিবিউট বক্সে আপনার ভেলুগুলো টাইপ করে <strong>Enter</strong> চাপুন (যেমন: Red লিখে Enter দিন)।</li>
              <li>সব ভেলু দেওয়া হয়ে গেলে <strong>"Generate Variations"</strong> বাটনে ক্লিক করুন।</li>
              <li>নিচে আপনার সব ভেরিয়েন্টের একটি তালিকা তৈরি হবে। সেখানে আপনি প্রতিটি ভেরিয়েন্টের আলাদা ছবি, প্রাইস এবং কালার দিতে পারবেন।</li>
            </ol>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
