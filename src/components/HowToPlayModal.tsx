import React from 'react';
import { X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { ColorTheme, Language } from '../types';
import { COLOR_THEMES } from '../utils/themes';
import { t } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  language: Language;
  colorTheme: ColorTheme;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  language,
  colorTheme,
  onClose
}) => {
  if (!isOpen) return null;

  const tr = t(language);
  const currentTheme = COLOR_THEMES[colorTheme];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-3xl p-5 border ${currentTheme.boardBg} max-h-[90vh] overflow-y-auto relative shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <HelpCircle className="text-emerald-400" size={22} />
            <span>{tr.rulesTitle}</span>
          </h2>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            id="close-rules-btn"
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Rules Body */}
        <div className="space-y-3 mb-5">
          {tr.rulesBody.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{rule}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          id="got-it-rules-btn"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
        >
          {language === 'bn' ? 'ঠিক আছে, খেলা শুরু করা যাক!' : 'Got it, let’s play!'}
        </button>
      </div>
    </div>
  );
};
