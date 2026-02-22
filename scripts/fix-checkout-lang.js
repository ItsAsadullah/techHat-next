const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'checkout', 'page.tsx');
let c = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // ── Validation errors ──────────────────────────────────
  ['নাম আবশ্যক', 'Name is required'],
  ['ফোন নম্বর আবশ্যক', 'Phone number is required'],
  ['সঠিক মোবাইল নম্বর দিন', 'Enter a valid phone number'],
  ['সঠিক বাংলাদেশি মোবাইল নম্বর দিন', 'Enter a valid Bangladeshi phone number'],
  ['বিভাগ বেছে নিন', 'Please select a division'],
  ['জেলা বেছে নিন', 'Please select a district'],
  ['সম্পূর্ণ ঠিকানা লিখুন', 'Full address is required'],
  ['মোবাইল নম্বর আবশ্যক', 'Mobile number is required'],
  ['ট্রানজেকশন আইডি আবশ্যক', 'Transaction ID is required'],

  // ── Coupon / order messages ────────────────────────────
  ['কুপন প্রয়োগ! ৳', 'Coupon applied! ৳'],
  [' ছাড়`', " discount`"],
  ['অবৈধ কুপন কোড', 'Invalid coupon code'],
  ['কুপন যাচাই করা যায়নি', 'Could not validate coupon'],
  ['অর্ডার প্লেস করা যায়নি। আবার চেষ্টা করুন।', 'Could not place order. Please try again.'],
  ['সার্ভার সংযোগে সমস্যা। আবার চেষ্টা করুন।', 'Server connection error. Please try again.'],
  ['অর্ডার প্রক্রিয়া হচ্ছে...', 'Processing order...'],
  ['অর্ডার নিশ্চিত করুন', 'Confirm Order'],

  // ── Success screen ─────────────────────────────────────
  ['অর্ডার সফল! 🎉', 'Order Placed! 🎉'],
  ['আপনার অর্ডার সফলভাবে গৃহীত হয়েছে', 'Your order has been successfully received'],
  ['অর্ডার নম্বর', 'Order Number'],
  ['পরিশোধযোগ্য', 'Amount Due'],
  ['আনুমানিক ডেলিভারি', 'Estimated Delivery'],
  ['৩–৫ কার্যদিবস', '3–5 Business Days'],
  ['-এ পাঠানো হয়েছে', ''],
  ['কনফার্মেশন {form.customerPhone}', 'Confirmation sent to {form.customerPhone}'],
  ['আমার অর্ডার', 'My Orders'],
  ['শপিং চালিয়ে যান', 'Continue Shopping'],

  // ── Empty cart ─────────────────────────────────────────
  ['কার্ট ফাঁকা', 'Your Cart is Empty'],
  ['চেকআউট করতে আগে কিছু পণ্য কার্টে যোগ করুন।', 'Add some products to your cart before checking out.'],
  ['শপিং শুরু করুন', 'Start Shopping'],

  // ── Navigation ─────────────────────────────────────────
  ['ফিরে যান', 'Back'],

  // ── Guest banner ──────────────────────────────────────
  ['সাইন ইন করে দ্রুত চেকআউট করুন', 'Sign in for faster checkout'],
  ['সেভড অ্যাড্রেস, অর্ডার ট্র্যাকিং ও অফার পান', 'Access saved addresses, order tracking & offers'],
  ['সাইন ইন', 'Sign In'],
  ['গেস্ট হিসেবে', 'Continue as Guest'],

  // ── Step 1 ─────────────────────────────────────────────
  ['কার্টে পণ্যসমূহ', 'Cart Items'],
  ['টি পণ্য`}', " items`}"],
  ['সর্বোচ্চ স্টক', 'Max stock reached'],
  ['আপনি ৳', 'You save ৳'],
  [' সাশ্রয় করছেন!', '!'],
  ['কুপন কোড', 'Coupon Code'],
  [' ছাড় প্রযোজ্য', ' discount applied'],
  ['কুপন কোড লিখুন', 'Enter coupon code'],
  ['প্রয়োগ করুন', 'Apply'],
  ['ডেলিভারি তথ্য দিন', 'Continue to Delivery'],

  // ── Step 2 ─────────────────────────────────────────────
  ['সেভ করা ঠিকানা', 'Saved Addresses'],
  ['ডিফল্ট', 'Default'],
  ['কম দেখুন', 'Show less'],
  ['ডেলিভারি তথ্য', 'Delivery Information'],
  ['পূর্ণ নাম', 'Full Name'],
  ['আপনার পূর্ণ নাম', 'Your full name'],
  ['মোবাইল নম্বর', 'Mobile Number'],
  ['ইমেইল (ঐচ্ছিক)', 'Email (Optional)'],
  ['বিভাগ', 'Division'],
  ['আগে বিভাগ বেছে নিন', 'Select division first'],
  ['জেলা বেছে নিন', 'Select district'],
  ['জেলা', 'District'],
  ['উপজেলা / থানা', 'Upazila / Thana'],
  ['উপজেলা বেছে নিন', 'Select upazila'],
  ['আগে জেলা বেছে নিন', 'Select district first'],
  ['সম্পূর্ণ ঠিকানা', 'Full Address'],
  ['বাড়ি নম্বর, রোড, এলাকা...', 'House no., road, area...'],
  ['অর্ডার নোট (ঐচ্ছিক)', 'Order Note (Optional)'],
  ['ডেলিভারি সম্পর্কে বিশেষ নির্দেশনা...', 'Special delivery instructions...'],
  ['ঢাকার মধ্যে', 'Inside Dhaka'],
  ['ঢাকার বাইরে', 'Outside Dhaka'],
  ['পেমেন্ট পদ্ধতি', 'Payment Method'],
  ['ফিরে যান', 'Back'],

  // ── Step 3 ─────────────────────────────────────────────
  ['বদলান', 'Edit'],
  ['ক্যাশ অন ডেলিভারি', 'Cash on Delivery'],
  ['পণ্য পাওয়ার পর পরিশোধ', 'Pay when you receive the product'],
  ['সবচেয়ে জনপ্রিয়', 'Most Popular'],
  ['মোবাইল ব্যাংকিং', 'Mobile Banking'],
  ['ব্যাংক ট্রান্সফার', 'Bank Transfer'],
  ['সরাসরি ব্যাংক অ্যাকাউন্টে', 'Direct to bank account'],
  ['অনলাইন পেমেন্ট', 'Online Payment'],
  ['ক্রেডিট / ডেবিট কার্ড, SSL Commerz', 'Credit / Debit Card, SSL Commerz'],
  ['নিরাপদ', 'Secure'],
  [`\${mobileProvider} নম্বরে পাঠান`, 'Send to ${mobileProvider}'],
  ['পরিমাণ:', 'Amount:'],
  ['যে নম্বর থেকে পাঠিয়েছেন', 'Number used to send payment'],
  ['ট্রানজেকশন আইডি (TrxID)', 'Transaction ID (TrxID)'],
  ['যেমন: ABC12345678', 'e.g. ABC12345678'],
  ['নিচের অ্যাকাউন্টে', 'Transfer ৳{grandTotal.toLocaleString()} to the account below'],
  [' ট্রান্সফার করুন এবং রেফারেন্স নম্বর আমাদের জানান।', ' and share your reference number with us.'],
  ['রেফারেন্স নম্বর (ঐচ্ছিক)', 'Reference Number (Optional)'],
  ['ট্রান্সফার রেফারেন্স নম্বর', 'Transfer reference number'],
  ['SSL Commerz সুরক্ষিত পেমেন্ট', 'SSL Commerz Secure Payment'],
  ["অর্ডার সাবমিটের পর SSL Commerz গেটওয়েতে রিডাইরেক্ট হবেন। Visa, Mastercard, নেট ব্যাংকিং সহ সব পদ্ধতি সমর্থিত।",
    "After submitting your order you'll be redirected to the SSL Commerz gateway. Visa, Mastercard, net banking and all methods supported."],
  ['স্টক সমস্যা', 'Stock Issue'],
  ['স্টক ফুরিয়ে গেছে', 'out of stock'],
  ['কার্ট আপডেট করুন', 'Update Cart'],
  ['ডেলিভারি তথ্য পরিবর্তন করুন', 'Edit delivery information'],

  // ── Trust badges ───────────────────────────────────────
  ['SSL সুরক্ষিত', 'SSL Secured'],
  ['৭ দিন রিটার্ন', '7-Day Return'],
  ['অরিজিনাল পণ্য', 'Genuine Products'],

  // ── Right column ───────────────────────────────────────
  ['অর্ডার সারসংক্ষেপ', 'Order Summary'],
  [' টি পণ্য', ' items'],
  ['টি পণ্য', ' items'],
  ['পণ্য উপমোট', 'Subtotal'],
  ["'ঢাকা'", "'Dhaka'"],
  ["'বাইরে'", "'Outside'"],
  ['কুপন ছাড়', 'Coupon Discount'],
  ['অফার সাশ্রয়', 'Offer Savings'],
  ['সর্বমোট', 'Total'],
  ['সুরক্ষিত পেমেন্ট', 'Secure Payment'],
  ['দ্রুত ডেলিভারি', 'Fast Delivery'],
  ['সহজ রিটার্ন', 'Easy Returns'],
  ['সাহায্য দরকার?', 'Need help?'],
  ['(৯টা–৯টা, সারাসপ্তাহ)', '(9am–9pm, 7 days)'],

  // ── Bank labels ────────────────────────────────────────
  ["label: 'ব্যাংক'", "label: 'Bank'"],
  ["label: 'অ্যাকাউন্ট'", "label: 'Account Name'"],
  ["label: 'নম্বর'", "label: 'Account No.'"],
  ["label: 'শাখা'", "label: 'Branch'"],
  ["label: 'রাউটিং'", "label: 'Routing'"],

  // ── আরো N টি দেখুন ────────────────────────────────────
  ['আরো ', 'Show '],
  ['টি দেখুন`', ' more`'],

  // ── ৳ taka symbol stays, but fix HTML character ────────
  // already fine
];

let count = 0;
for (const [from, to] of replacements) {
  if (c.includes(from)) {
    c = c.split(from).join(to);
    count++;
  }
}

fs.writeFileSync(filePath, c, 'utf8');
console.log(`Done. Applied ${count}/${replacements.length} replacements.`);
