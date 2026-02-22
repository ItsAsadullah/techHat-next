import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────
//  Demo/static coupons (replace with DB lookup when a
//  Coupon model is added to the Prisma schema)
// ─────────────────────────────────────────────────────────

interface Coupon {
  code: string;
  type: 'flat' | 'percent';
  value: number;        // flat BDT amount or percentage
  minOrder: number;     // minimum subtotal required
  maxDiscount?: number; // cap for percent coupons
}

const COUPONS: Coupon[] = [
  { code: 'TECHHAT100', type: 'flat',    value: 100,  minOrder: 500  },
  { code: 'TECHHAT200', type: 'flat',    value: 200,  minOrder: 1000 },
  { code: 'SAVE10',     type: 'percent', value: 10,   minOrder: 500,  maxDiscount: 300 },
  { code: 'SAVE15',     type: 'percent', value: 15,   minOrder: 1000, maxDiscount: 500 },
  { code: 'WELCOME50',  type: 'flat',    value: 50,   minOrder: 0    },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string = (body.code ?? '').trim().toUpperCase();
    const subtotal: number = Number(body.subtotal ?? 0);

    if (!code) {
      return NextResponse.json({ valid: false, message: 'কুপন কোড প্রয়োজন' }, { status: 400 });
    }

    const coupon = COUPONS.find(c => c.code === code);

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'কুপন কোডটি বৈধ নয়' });
    }

    if (subtotal < coupon.minOrder) {
      return NextResponse.json({
        valid: false,
        message: `এই কুপনের জন্য ন্যূনতম অর্ডার ৳${coupon.minOrder} হতে হবে`,
      });
    }

    let discount: number;
    if (coupon.type === 'flat') {
      discount = coupon.value;
    } else {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    }

    return NextResponse.json({ valid: true, discount, message: 'কুপন সফলভাবে প্রয়োগ হয়েছে' });
  } catch {
    return NextResponse.json(
      { valid: false, message: 'কুপন যাচাই করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
