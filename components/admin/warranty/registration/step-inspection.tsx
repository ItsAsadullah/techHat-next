'use client';

import { cn } from '@/lib/utils';
import { Sparkles, ThumbsUp, Minus, AlertTriangle, Wrench, Droplets, ShieldOff, Check } from 'lucide-react';

const CONDITIONS = [
  { id: 'Excellent',    label: 'Excellent',     desc: 'No marks, pristine',  icon: Sparkles,    ring: 'ring-emerald-500',  bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-400' },
  { id: 'Good',         label: 'Good',           desc: 'Minor wear, clean',   icon: ThumbsUp,    ring: 'ring-blue-500',     bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-400'    },
  { id: 'Used',         label: 'Used',           desc: 'Normal usage signs',  icon: Minus,       ring: 'ring-slate-400',    bg: 'bg-slate-50',    text: 'text-slate-700',    border: 'border-slate-400'   },
  { id: 'Minor Scratch',label: 'Minor Scratch',  desc: 'Light surface marks', icon: AlertTriangle,ring:'ring-amber-400',    bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-400'   },
  { id: 'Major Damage', label: 'Major Damage',   desc: 'Deep cracks, dents',  icon: Wrench,      ring: 'ring-orange-500',   bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-400'  },
  { id: 'Water Damage', label: 'Water Damage',   desc: 'Liquid exposure',     icon: Droplets,    ring: 'ring-cyan-500',     bg: 'bg-cyan-50',     text: 'text-cyan-700',     border: 'border-cyan-400'    },
  { id: 'Tampered',     label: 'Tampered',       desc: 'Seal broken, opened', icon: ShieldOff,   ring: 'ring-red-500',      bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-400'     },
];

const ACCESSORIES_LIST = [
  { id: 'Box',       label: 'Original Box',      emoji: '📦' },
  { id: 'Charger',   label: 'Charger / Adapter', emoji: '🔌' },
  { id: 'Cable',     label: 'USB Cable',          emoji: '🔗' },
  { id: 'Manual',    label: 'User Manual',        emoji: '📖' },
  { id: 'Earbuds',   label: 'Earbuds',           emoji: '🎧' },
  { id: 'Battery',   label: 'Spare Battery',     emoji: '🔋' },
  { id: 'SIM Tray',  label: 'SIM Tray / Tool',   emoji: '📌' },
  { id: 'Remote',    label: 'Remote Control',     emoji: '📡' },
];

interface StepInspectionProps {
  condition: string;
  onChangeCondition: (c: string) => void;
  accessoriesReceived: string[];
  onChangeAccessories: (a: string[]) => void;
}

export function StepInspection({ condition, onChangeCondition, accessoriesReceived, onChangeAccessories }: StepInspectionProps) {
  const toggle = (id: string) =>
    onChangeAccessories(
      accessoriesReceived.includes(id)
        ? accessoriesReceived.filter(a => a !== id)
        : [...accessoriesReceived, id]
    );

  const missing = ACCESSORIES_LIST.filter(a => !accessoriesReceived.includes(a.id));
  const received = ACCESSORIES_LIST.filter(a => accessoriesReceived.includes(a.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Physical Inspection</h2>
        <p className="text-sm text-slate-500 mt-1">Record the exact condition and accessories received</p>
      </div>

      {/* ── Condition Cards ── */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Product Condition</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {CONDITIONS.map(cond => {
            const Icon = cond.icon;
            const isSelected = condition === cond.id;
            return (
              <button
                key={cond.id}
                type="button"
                onClick={() => onChangeCondition(cond.id)}
                className={cn(
                  'relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-2.5',
                  isSelected
                    ? `${cond.border} ${cond.bg} shadow-md`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {isSelected && (
                  <span className={cn('absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center', cond.bg, cond.border, 'border')}>
                    <Check className={cn('w-3 h-3', cond.text)} />
                  </span>
                )}
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isSelected ? `${cond.bg} ${cond.text} ring-2 ${cond.ring} ring-offset-1` : 'bg-slate-100 text-slate-500')}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className={cn('font-bold text-sm leading-none', isSelected ? cond.text : 'text-slate-800')}>{cond.label}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{cond.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Accessories Checklist ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accessories Checklist</label>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="text-emerald-600">{received.length} received</span>
            <span className="text-slate-300">·</span>
            <span className="text-red-500">{missing.length} missing</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ACCESSORIES_LIST.map(acc => {
            const isChecked = accessoriesReceived.includes(acc.id);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => toggle(acc.id)}
                className={cn(
                  'relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-2',
                  isChecked
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100'
                    : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xl">{acc.emoji}</span>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                  )}>
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className={cn('text-xs font-bold leading-tight', isChecked ? 'text-emerald-800' : 'text-slate-600')}>{acc.label}</p>
                {!isChecked && (
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Missing</span>
                )}
              </button>
            );
          })}
        </div>

        {missing.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700">Missing accessories will be recorded on the service ticket</p>
              <p className="text-[11px] text-red-500 mt-0.5">
                {missing.map(a => a.label).join(' · ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
