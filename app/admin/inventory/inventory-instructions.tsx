"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, BookOpen, Warehouse, Activity, ArrowRightLeft, DollarSign, BookText, Settings2 } from "lucide-react";
// Removed ScrollArea import to use native scrolling

export function InventoryInstructions() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
          <Info className="h-4 w-4" />
          কীভাবে কাজ করে
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-indigo-50/50">
          <DialogTitle className="flex items-center gap-2 text-xl text-indigo-900">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            ইনভেন্টরি ম্যানেজমেন্ট গাইড
          </DialogTitle>
          <DialogDescription>
            TechHat ইনভেন্টরি সিস্টেম কীভাবে আপনার স্টক প্রসেস এবং ট্র্যাক করে তা জানুন।
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8 pr-2">
            
            {/* KPI Section */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                ১. ড্যাশবোর্ড স্ট্যাটাস
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li><strong className="text-foreground">Physical Stock:</strong> বর্তমানে আপনার গোডাউনে থাকা মোট প্রোডাক্টের সংখ্যা।</li>
                <li><strong className="text-foreground">Reserved Stock:</strong> কাস্টমার অর্ডার করেছে কিন্তু এখনো শিপিং বা ডেলিভারি হয়নি এমন প্রোডাক্ট।</li>
                <li><strong className="text-foreground">Available to Sell:</strong> ফিজিক্যাল স্টক থেকে রিজার্ভড স্টক বাদ দিলে যা থাকে। অর্থাৎ, বর্তমানে ওয়েবসাইটের কাস্টমাররা এই পরিমাণ অর্ডার করতে পারবে।</li>
              </ul>
            </section>

            {/* Core Modules Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                ২. কোর মডিউলসমূহ
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3 bg-muted/30">
                  <h4 className="font-medium text-sm flex items-center gap-1.5 mb-1">
                    <span className="bg-primary/10 text-primary p-1 rounded">IN</span>
                    GRN (গুডস রিসিভ নোট)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    সাপ্লায়ারের কাছ থেকে নতুন স্টক রিসিভ করার সময় ব্যবহৃত হয়। GRN এপ্রুভ করলে ফিজিক্যাল স্টক বেড়ে যায় এবং লেজারে একটি "IN" ট্রানজেকশন রেকর্ড হয়।
                  </p>
                </div>

                <div className="rounded-lg border p-3 bg-muted/30">
                  <h4 className="font-medium text-sm flex items-center gap-1.5 mb-1">
                    <ArrowRightLeft className="h-4 w-4 text-orange-500" />
                    ট্রান্সফার (Transfers)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    এক গোডাউন থেকে অন্য গোডাউনে স্টক স্থানান্তর। এটি সোর্স গোডাউন থেকে স্টক কমায় এবং ডেস্টিনেশন গোডাউনে স্টক বাড়ায়।
                  </p>
                </div>

                <div className="rounded-lg border p-3 bg-muted/30 sm:col-span-2">
                  <h4 className="font-medium text-sm flex items-center gap-1.5 mb-1">
                    <Settings2 className="h-4 w-4 text-red-500" />
                    অ্যাডজাস্টমেন্ট (Adjustments)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    সিস্টেমের স্টক এবং বাস্তব স্টকের মধ্যে অমিল দূর করতে ব্যবহৃত হয়। অতিরিক্ত প্রোডাক্ট পাওয়া গেলে "Addition" এবং নষ্ট/হারিয়ে গেলে "Deduction" ব্যবহার করুন। ড্যামেজ হিসেবে ডিডাক্ট করলে তা "Damaged Stock" এ যোগ হবে।
                  </p>
                </div>
              </div>
            </section>

            {/* Financial & Audit Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <BookText className="h-4 w-4 text-muted-foreground" />
                ৩. অডিট এবং ভ্যালুয়েশন
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">স্টক লেজার (ব্যাংক স্টেটমেন্ট)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    স্টকের প্রতিটি পরিবর্তন (যেমন: অর্ডার, রিটার্ন, GRN, Adjustment) এখানে রেকর্ড হয়। এটি একটি অপরিবর্তনযোগ্য অডিট লগ যা ১০০% স্বচ্ছতা নিশ্চিত করে।
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">ভ্যালুয়েশন (Valuation)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    সর্বশেষ ক্রয়মূল্যের (Unit Cost) ওপর ভিত্তি করে বর্তমান স্টকের মোট আর্থিক মূল্য হিসাব করে। বছর শেষের হিসাব-নিকাশের জন্য এটি অত্যন্ত জরুরি।
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}