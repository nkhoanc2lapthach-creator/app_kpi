'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface SliderControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
  type?: 'progress' | 'quality';
}

export function SliderControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 5,
  unit = '%',
  onChange,
  disabled = false,
  type = 'progress',
}: SliderControlProps) {
  const isQuality = type === 'quality';
  const isExceeded = isQuality && value > 100;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700 flex items-center gap-1">
          {label}
          {isExceeded && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
              <Sparkles className="w-2.5 h-2.5" /> Vượt yêu cầu
            </span>
          )}
        </span>
        <span
          className={`font-bold px-2 py-0.5 rounded text-xs ${
            isExceeded
              ? 'bg-purple-600 text-white'
              : value === 100
              ? 'bg-emerald-100 text-emerald-800'
              : value < 70
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value}
          {unit}
        </span>
      </div>

      {/* Thanh trượt */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed ${
          isExceeded ? 'accent-purple-600' : 'accent-indigo-600'
        }`}
      />

      {/* Quick click presets */}
      {!disabled && (
        <div className="flex items-center gap-1 pt-1 justify-end">
          {isQuality ? (
            <>
              <button
                type="button"
                onClick={() => onChange(90)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                90%
              </button>
              <button
                type="button"
                onClick={() => onChange(100)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium"
              >
                100% Đạt
              </button>
              <button
                type="button"
                onClick={() => onChange(110)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold"
              >
                +110% Vượt
              </button>
              <button
                type="button"
                onClick={() => onChange(120)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold"
              >
                +120% Max
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onChange(50)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => onChange(80)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                80%
              </button>
              <button
                type="button"
                onClick={() => onChange(100)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium"
              >
                100% Xong
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
