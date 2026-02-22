'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  paymentMethod: 'MOBILE_BANKING' | 'CARD';
  onConfirm: (details: {
    mobileTrxId?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    mobileCashOutCharge?: number;
    // Card details
    cardTrxId?: string;
    cardLast4?: string;
  }) => void;
}

export function PaymentDetailsModal({ isOpen, onClose, grandTotal, paymentMethod, onConfirm }: PaymentDetailsModalProps) {
  const [mobileProvider, setMobileProvider] = useState('bKash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileTrxId, setMobileTrxId] = useState('');
  const [mobileCashOutCharge, setMobileCashOutCharge] = useState(0);
  
  // Card states
  const [cardTrxId, setCardTrxId] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  
  // Reset fields when opening
  useEffect(() => {
    if (isOpen) {
      setMobileProvider('bKash');
      setMobileNumber('');
      setMobileTrxId('');
      setMobileCashOutCharge(0);
      setCardTrxId('');
      setCardLast4('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (paymentMethod === 'MOBILE_BANKING') {
      onConfirm({
        mobileProvider,
        mobileNumber,
        mobileTrxId,
        mobileCashOutCharge: mobileCashOutCharge > 0 ? mobileCashOutCharge : undefined,
      });
    } else {
      onConfirm({
        cardTrxId,
        cardLast4
      });
    }
    onClose();
  };

  const isValid = paymentMethod === 'MOBILE_BANKING' 
    ? (mobileNumber.length >= 11 && mobileTrxId.length > 3)
    : (cardTrxId.length > 2); // Require Transaction ID for Card too

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentMethod === 'MOBILE_BANKING' ? (
              <>
                <Smartphone className="h-5 w-5 text-pink-600" />
                Mobile Banking Details
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 text-blue-600" />
                Card Payment Confirmation
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount Display */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
            <p className="text-3xl font-black text-gray-900">৳{grandTotal.toLocaleString()}</p>
          </div>

          {/* Mobile Banking Fields */}
          {paymentMethod === 'MOBILE_BANKING' && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Provider</Label>
                  <Select value={mobileProvider} onValueChange={setMobileProvider}>
                    <SelectTrigger>
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Customer Phone</Label>
                  <Input 
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="017..."
                    type="tel"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Transaction ID (TrxID)</Label>
                <Input 
                  value={mobileTrxId}
                  onChange={(e) => setMobileTrxId(e.target.value)}
                  placeholder="e.g. 8AD7..."
                  className="uppercase font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Cash Out Charge (Optional)</Label>
                <Input 
                  type="number"
                  value={mobileCashOutCharge || ''}
                  onChange={(e) => setMobileCashOutCharge(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
          )}

          {/* Card Fields */}
          {paymentMethod === 'CARD' && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center py-2 text-gray-500 text-sm border-b border-gray-100 mb-2">
                <p>Process payment of <span className="font-bold text-gray-900">৳{grandTotal.toLocaleString()}</span> on POS terminal.</p>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Transaction ID (Required)</Label>
                <Input 
                  value={cardTrxId}
                  onChange={(e) => setCardTrxId(e.target.value)}
                  placeholder="Terminal Trx ID..."
                  className="uppercase font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Last 4 Digits (Optional)</Label>
                <Input 
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.slice(0, 4))}
                  placeholder="e.g. 1234"
                  className="font-mono"
                  maxLength={4}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!isValid}
              className={paymentMethod === 'MOBILE_BANKING' ? 'bg-pink-600 hover:bg-pink-700 flex-1' : 'bg-blue-600 hover:bg-blue-700 flex-1'}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
