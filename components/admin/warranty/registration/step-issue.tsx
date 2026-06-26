'use client';

import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Monitor, BatteryLow, Zap, Volume2, Mic, Bluetooth,
  Camera, Code2, Droplets, HelpCircle, CheckCircle2,
  ImagePlus, Video, Mic2, X
} from 'lucide-react';

const ISSUE_CATEGORIES = [
  { id: 'Display Issue',       label: 'Display',       desc: 'Screen, touch, pixels',    icon: Monitor,     color: 'blue'   },
  { id: 'Battery Issue',       label: 'Battery',       desc: 'Drain, not charging',       icon: BatteryLow,  color: 'amber'  },
  { id: 'Charging Issue',      label: 'Charging',      desc: 'Port, cable, adapter',      icon: Zap,         color: 'yellow' },
  { id: 'Speaker Issue',       label: 'Speaker',       desc: 'No sound, distortion',      icon: Volume2,     color: 'purple' },
  { id: 'Microphone Issue',    label: 'Mic',           desc: 'Inaudible, static',         icon: Mic,         color: 'pink'   },
  { id: 'Bluetooth Issue',     label: 'Bluetooth',     desc: 'Not pairing, drops',        icon: Bluetooth,   color: 'indigo' },
  { id: 'Camera Issue',        label: 'Camera',        desc: 'Blurry, won\'t open',       icon: Camera,      color: 'teal'   },
  { id: 'Software Issue',      label: 'Software',      desc: 'Crash, boot loop, OS',      icon: Code2,       color: 'violet' },
  { id: 'Water Damage',        label: 'Water Damage',  desc: 'Liquid exposure',           icon: Droplets,    color: 'cyan'   },
  { id: 'Other',               label: 'Other',         desc: 'Describe below',            icon: HelpCircle,  color: 'gray'   },
];

const COLOR_MAP: Record<string, { idle: string; active: string; icon: string }> = {
  blue:   { idle: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50',   active: 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100',   icon: 'bg-blue-100 text-blue-600'   },
  amber:  { idle: 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50', active: 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100', icon: 'bg-amber-100 text-amber-600' },
  yellow: { idle: 'border-slate-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50',active:'border-yellow-500 bg-yellow-50 shadow-md shadow-yellow-100',icon:'bg-yellow-100 text-yellow-600'},
  purple: { idle: 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50',active:'border-purple-500 bg-purple-50 shadow-md shadow-purple-100',icon:'bg-purple-100 text-purple-600'},
  pink:   { idle: 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50',   active: 'border-pink-500 bg-pink-50 shadow-md shadow-pink-100',   icon: 'bg-pink-100 text-pink-600'   },
  indigo: { idle: 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50',active:'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100',icon:'bg-indigo-100 text-indigo-600'},
  teal:   { idle: 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50',   active: 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100',   icon: 'bg-teal-100 text-teal-600'   },
  violet: { idle: 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50',active:'border-violet-500 bg-violet-50 shadow-md shadow-violet-100',icon:'bg-violet-100 text-violet-600'},
  cyan:   { idle: 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50',   active: 'border-cyan-500 bg-cyan-50 shadow-md shadow-cyan-100',   icon: 'bg-cyan-100 text-cyan-600'   },
  gray:   { idle: 'border-slate-200 bg-white hover:border-gray-400 hover:bg-gray-50',      active: 'border-gray-500 bg-gray-50 shadow-md',                   icon: 'bg-gray-100 text-gray-600'   },
};

interface StepIssueProps {
  selectedCategories: string[];
  onChangeCategories: (c: string[]) => void;
  description: string;
  onChangeDescription: (d: string) => void;
}

export function StepIssue({ selectedCategories, onChangeCategories, description, onChangeDescription }: StepIssueProps) {
  const toggle = (id: string) =>
    onChangeCategories(
      selectedCategories.includes(id)
        ? selectedCategories.filter(c => c !== id)
        : [...selectedCategories, id]
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">What's the issue?</h2>
        <p className="text-sm text-slate-500 mt-1">Select all that apply — multiple issues allowed</p>
      </div>

      {/* ── Issue Category Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {ISSUE_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategories.includes(cat.id);
          const colors = COLOR_MAP[cat.color];
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={cn(
                'relative p-4 rounded-2xl border-2 text-left flex flex-col gap-3 transition-all duration-200 group',
                isSelected ? colors.active : colors.idle
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-current rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </span>
              )}
              {isSelected && (
                <CheckCircle2 className="absolute top-2.5 right-2.5 w-5 h-5 text-current opacity-80" />
              )}
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors.icon)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 leading-none">{cat.label}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">{cat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Selected Tags ── */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
          {selectedCategories.map(id => {
            const cat = ISSUE_CATEGORIES.find(c => c.id === id);
            if (!cat) return null;
            const colors = COLOR_MAP[cat.color];
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  colors.active
                )}
              >
                {cat.label}
                <X className="w-3 h-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Description ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer's Description</label>
          <span className="text-[11px] text-slate-400">{description.length}/500</span>
        </div>
        <Textarea
          placeholder="Describe the issue exactly as reported by the customer. Include when it started, under what conditions it occurs, and anything the customer tried..."
          className="min-h-[130px] rounded-xl resize-none text-sm border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 placeholder:text-slate-400"
          value={description}
          maxLength={500}
          onChange={e => onChangeDescription(e.target.value)}
        />
      </div>

      {/* ── Media Evidence ── */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Media Evidence (Optional)</label>
        <div className="grid grid-cols-3 gap-3">
          <button type="button" className="h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-1.5 group">
            <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">Add Photo</span>
          </button>
          <button type="button" className="h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center justify-center gap-1.5 group">
            <Video className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-purple-600">Add Video</span>
          </button>
          <button type="button" className="h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center gap-1.5 group">
            <Mic2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-600">Voice Note</span>
          </button>
        </div>
      </div>
    </div>
  );
}
