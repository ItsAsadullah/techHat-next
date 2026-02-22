'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Smartphone, Banknote, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MixedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirm: (breakdown: { 
    cash: number; 
    card: number; 
    mobile: number;
    // Mobile details
    mobileTrxId?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    mobileCashOutCharge?: number;
    // Card details
    cardTrxId?: string;
    cardLast4?: string;
  }) => void;
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function MixedPaymentModal({ isOpen, onClose, grandTotal, onConfirm }: MixedPaymentModalProps) {
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [mobile, setMobile] = useState(0);
  
  // Mobile Banking Fields
  const [mobileProvider, setMobileProvider] = useState('bKash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileTrxId, setMobileTrxId] = useState('');
  const [mobileCashOutCharge, setMobileCashOutCharge] = useState(0);

  // Card Fields
  const [cardTrxId, setCardTrxId] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  const total = cash + card + mobile;
  const remaining = Math.max(0, grandTotal - total);
  // Ensure total equals grandTotal exactly for mixed payments
  const isValid = total === grandTotal;

  // Validation
  const isMobileValid = mobile > 0 ? (mobileNumber.length >= 11 && mobileTrxId.length > 3) : true;
  const isCardValid = card > 0 ? (cardTrxId.length > 2) : true;

  const handleConfirm = () => {
    if (isValid && isMobileValid && isCardValid) {
      onConfirm({ 
        cash, 
        card, 
        mobile,
        mobileTrxId: mobile > 0 ? mobileTrxId : undefined,
        mobileNumber: mobile > 0 ? mobileNumber : undefined,
        mobileProvider: mobile > 0 ? mobileProvider : undefined,
        mobileCashOutCharge: mobile > 0 ? mobileCashOutCharge : undefined,
        cardTrxId: card > 0 ? cardTrxId : undefined,
        cardLast4: card > 0 ? cardLast4 : undefined,
      });
      handleReset();
    }
  };

  const handleReset = () => {
    setCash(0);
    setCard(0);
    setMobile(0);
    setMobileNumber('');
    setMobileTrxId('');
    setMobileCashOutCharge(0);
    setMobileProvider('bKash');
    setCardTrxId('');
    setCardLast4('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleQuickSplit = (type: 'equal' | 'cash-rest') => {
    if (type === 'equal') {
      const perMethod = Math.floor(grandTotal / 3);
      setCash(perMethod);
      setCard(perMethod);
      setMobile(grandTotal - perMethod * 2); // Remainder goes to mobile
    } else {
      // Cash + one other method
      const half = Math.floor(grandTotal / 2);
      setCash(half);
      setCard(grandTotal - half);
      setMobile(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Mixed Payment Split
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Payment Inputs */}
          <div className="md:col-span-2 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Methods</h3>
            <div className="space-y-3">
            {/* Cash */}
            <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg border border-green-200">
              <Banknote className="h-5 w-5 text-green-600 shrink-0 mt-2" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs text-green-700 font-semibold">Cash</Label>
                  {remaining > 0 && (
                    <button 
                      onClick={() => setCash(cash + remaining)}
                      className="text-[10px] flex items-center gap-1 text-green-700 hover:bg-green-100 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <Wand2 className="h-3 w-3" /> Auto-fill
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  value={cash || ''}
                  onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-9 bg-white border-green-200"
                  min={0}
                  step={10}
                />
              </div>
              <Badge className="bg-green-600 shrink-0 mt-6">৳{cash.toLocaleString()}</Badge>
            </div>

            {/* Card */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <CreditCard className="h-5 w-5 text-blue-600 shrink-0 mt-2" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <Label className="text-xs text-blue-700 font-semibold">Card</Label>
                     {remaining > 0 && (
                        <button 
                          onClick={() => setCard(card + remaining)}
                          className="text-[10px] flex items-center gap-1 text-blue-700 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                        >
                          <Wand2 className="h-3 w-3" /> Auto-fill
                        </button>
                      )}
                  </div>
                  <Input
                    type="number"
                    value={card || ''}
                    onChange={(e) => setCard(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 bg-white border-blue-200"
                    min={0}
                    step={10}
                  />
                </div>
                <Badge className="bg-blue-600 shrink-0 mt-6">৳{card.toLocaleString()}</Badge>
              </div>

              {/* Card Details Inputs - Only show if card amount > 0 */}
              {card > 0 && (
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-3 ml-2 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Transaction ID</Label>
                    <Input 
                      value={cardTrxId}
                      onChange={(e) => setCardTrxId(e.target.value)}
                      placeholder="e.g. TRX123..."
                      className="h-8 bg-white uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last 4 Digits (Optional)</Label>
                    <Input 
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.slice(0, 4))}
                      placeholder="e.g. 1234"
                      className="h-8 bg-white font-mono"
                      maxLength={4}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-pink-50 p-3 rounded-lg border border-pink-200">
                <Smartphone className="h-5 w-5 text-pink-600 shrink-0 mt-2" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-xs text-pink-700 font-semibold">Mobile Banking</Label>
                    {remaining > 0 && (
                      <button 
                        onClick={() => setMobile(mobile + remaining)}
                        className="text-[10px] flex items-center gap-1 text-pink-700 hover:bg-pink-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <Wand2 className="h-3 w-3" /> Auto-fill
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={mobile || ''}
                    onChange={(e) => setMobile(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 bg-white border-pink-200"
                    min={0}
                    step={10}
                  />
                </div>
                <Badge className="bg-pink-600 shrink-0 mt-6">৳{mobile.toLocaleString()}</Badge>
              </div>

              {/* Mobile Details Inputs - Only show if mobile amount > 0 */}
              {mobile > 0 && (
                <div className="bg-pink-50/50 p-3 rounded-lg border border-pink-100 space-y-3 ml-2 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Provider</Label>
                      <Select value={mobileProvider} onValueChange={setMobileProvider}>
                        <SelectTrigger className="h-8 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bKash">bKash</SelectItem>
                          <SelectItem value="Nagad">Nagad</SelectItem>
                          <SelectItem value="Rocket">Rocket</SelectItem>
                          <SelectItem value="Upay">Upay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone Number</Label>
                      <Input 
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="017..."
                        className="h-8 bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Transaction ID (TrxID)</Label>
                    <Input 
                      value={mobileTrxId}
                      onChange={(e) => setMobileTrxId(e.target.value)}
                      placeholder="e.g. 8AD7..."
                      className="h-8 bg-white uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cash Out Charge (Optional)</Label>
                    <Input 
                      type="number"
                      value={mobileCashOutCharge || ''}
                      onChange={(e) => setMobileCashOutCharge(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 bg-white"
                      min={0}
                    />
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="space-y-4 h-full flex flex-col">
          {/* Total Display */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-3xl font-black text-gray-900">৳{grandTotal.toLocaleString()}</p>
            {remaining > 0 && (
              <p className="text-sm text-red-600 mt-2 font-semibold flex items-center gap-1">
                Remaining: ৳{remaining.toLocaleString()}
              </p>
            )}
            {total > grandTotal && (
              <p className="text-sm text-red-600 mt-2 font-semibold flex items-center gap-1">
                Amount exceeds total by ৳{(total - grandTotal).toLocaleString()}
              </p>
            )}
          </div>

          {/* Quick Split Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">Quick Actions</p>
            <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSplit('equal')}
              className="w-full text-xs justify-start"
            >
              Split Equally (All 3)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSplit('cash-rest')}
              className="w-full text-xs justify-start"
            >
              50% Cash + 50% Card
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                 setCash(grandTotal);
                 setCard(0);
                 setMobile(0);
              }}
              className="w-full text-xs justify-start"
            >
              Reset to Cash Only
            </Button>
            </div>
          </div>

          <div className="mt-auto space-y-4">
          {/* Total Collected */}
          <div className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Input</span>
            <span className={cn(
              'text-2xl font-black',
              isValid ? 'text-green-600' : 'text-red-600'
            )}>
              ৳{total.toLocaleString()}
            </span>
          </div>

          {/* Validation Messages */}
          <div className="space-y-1 text-xs font-semibold text-red-600">
             {card > 0 && !isCardValid && (
               <p>• Card Transaction ID is required</p>
             )}
             {mobile > 0 && mobileNumber.length < 11 && (
               <p>• Valid Mobile Number is required (11 digits)</p>
             )}
             {mobile > 0 && mobileTrxId.length <= 3 && (
               <p>• Mobile Transaction ID is required</p>
             )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid || !isMobileValid || !isCardValid}
              className={cn(
                'w-full font-bold',
                isValid && isMobileValid && isCardValid ? 'bg-purple-600 hover:bg-purple-700' : ''
              )}
            >
              Confirm
            </Button>
          </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
