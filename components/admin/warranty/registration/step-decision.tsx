'use client';

import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wrench, Truck, RotateCcw, XOctagon, ScanSearch,
  Clock, AlertTriangle, ChevronDown, Check, Flame, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

const DECISIONS = [
  {
    id: 'REPAIR',
    label: 'In-House Repair',
    desc: 'Assign to a technician for diagnosis & repair',
    icon: Wrench,
    badge: '2–5 Days',
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
    active: 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg shadow-blue-100',
    idle: 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'SUPPLIER',
    label: 'Send to Supplier',
    desc: 'Dispatch to brand service center',
    icon: Truck,
    badge: '7–21 Days',
    badgeColor: 'text-orange-600 bg-orange-50 border-orange-200',
    active: 'border-orange-500 bg-gradient-to-br from-orange-50 to-white shadow-lg shadow-orange-100',
    idle: 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'REPLACE',
    label: 'Replacement',
    desc: 'Exchange with identical or similar unit',
    icon: RotateCcw,
    badge: 'Same Day',
    badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    active: 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-lg shadow-emerald-100',
    idle: 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'REJECT',
    label: 'Reject Claim',
    desc: 'Warranty void — physical damage, tampering',
    icon: XOctagon,
    badge: 'Closed',
    badgeColor: 'text-red-600 bg-red-50 border-red-200',
    active: 'border-red-500 bg-gradient-to-br from-red-50 to-white shadow-lg shadow-red-100',
    idle: 'border-slate-200 bg-white hover:border-red-300 hover:shadow-md',
    iconBg: 'bg-red-100 text-red-600',
  },
  {
    id: 'INSPECT',
    label: 'Further Inspection',
    desc: 'Hold for senior technician review',
    icon: ScanSearch,
    badge: '1–2 Days',
    badgeColor: 'text-violet-600 bg-violet-50 border-violet-200',
    active: 'border-violet-500 bg-gradient-to-br from-violet-50 to-white shadow-lg shadow-violet-100',
    idle: 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md',
    iconBg: 'bg-violet-100 text-violet-600',
  },
];

const TECHNICIANS = [
  { id: 'tech_joy',    name: 'Joy Rahman',    skills: 'Display · Motherboard' },
  { id: 'tech_shuvo',  name: 'Shuvo Ahmed',   skills: 'Battery · Charging'    },
  { id: 'tech_rashed', name: 'Rashed Islam',  skills: 'Software · Camera'     },
];

const PRIORITY_OPTIONS = [
  { id: 'LOW',    label: 'Low',    desc: 'Standard queue',       icon: ArrowDown, color: 'text-slate-500', bg: 'bg-slate-100' },
  { id: 'MEDIUM', label: 'Medium', desc: 'Normal priority',       icon: Minus,     color: 'text-blue-600',  bg: 'bg-blue-50'   },
  { id: 'HIGH',   label: 'High',   desc: 'Expedite processing',  icon: ArrowUp,   color: 'text-amber-600', bg: 'bg-amber-50'  },
  { id: 'URGENT', label: 'Urgent', desc: 'Express service',       icon: Flame,     color: 'text-red-600',   bg: 'bg-red-50'    },
];

interface StepDecisionProps {
  decision: string;
  onChangeDecision: (d: string) => void;
  technician: string;
  onChangeTechnician: (t: string) => void;
  priority: string;
  onChangePriority: (p: string) => void;
  internalNotes: string;
  onChangeNotes: (n: string) => void;
}

export function StepDecision({ decision, onChangeDecision, technician, onChangeTechnician, priority, onChangePriority, internalNotes, onChangeNotes }: StepDecisionProps) {
  const selectedDecision = DECISIONS.find(d => d.id === decision);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Resolution Decision</h2>
        <p className="text-sm text-slate-500 mt-1">Choose what action to take for this warranty claim</p>
      </div>

      {/* ── Decision Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {DECISIONS.map(dec => {
          const Icon = dec.icon;
          const isSelected = decision === dec.id;
          return (
            <button
              key={dec.id}
              type="button"
              onClick={() => onChangeDecision(dec.id)}
              className={cn(
                'relative p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-3',
                isSelected ? dec.active : dec.idle
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-current rounded-full flex items-center justify-center opacity-10" />
              )}
              {isSelected && (
                <Check className="absolute top-3 right-3 w-5 h-5 text-current opacity-70" />
              )}
              <div className="flex items-start gap-3">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', dec.iconBg)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-900 leading-snug">{dec.label}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{dec.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', dec.badgeColor)}>
                  {dec.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Technician + Priority (shown for REPAIR and INSPECT) ── */}
      {(decision === 'REPAIR' || decision === 'INSPECT') && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <h3 className="text-sm font-bold text-slate-700">Assignment Details</h3>

          {/* Technician cards */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assign Technician</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TECHNICIANS.map(tech => {
                const isSelected = technician === tech.id;
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => onChangeTechnician(tech.id)}
                    className={cn(
                      'p-3.5 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                        {tech.name.charAt(0)}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-none">{tech.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{tech.skills}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Priority</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map(p => {
                const Icon = p.icon;
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChangePriority(p.id)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? `border-current ${p.bg} shadow-sm ${p.color}`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 mb-1.5', isSelected ? p.color : 'text-slate-400')} />
                    <p className={cn('text-sm font-bold leading-none', isSelected ? p.color : 'text-slate-700')}>{p.label}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {priority === 'URGENT' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              Urgent tickets skip the queue and are immediately escalated to a senior technician.
            </div>
          )}
        </div>
      )}

      {/* ── Internal Notes ── */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Internal Notes</label>
        <Textarea
          placeholder="Add notes for the technician or warehouse team. Not visible to the customer..."
          className="min-h-[100px] rounded-xl resize-none text-sm border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 placeholder:text-slate-400"
          value={internalNotes}
          onChange={e => onChangeNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
