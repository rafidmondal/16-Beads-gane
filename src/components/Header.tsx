import React from 'react';
import { Volume2, VolumeX, BarChart3, HelpCircle, Settings, Globe } from 'lucide-react';
import { ColorTheme, Language } from '../types';
import { COLOR_THEMES } from '../utils/themes';
import { t } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  colorTheme: ColorTheme;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  soundEnabled,
  onToggleSound,
  colorTheme,
  onOpenSettings,
  onOpenStats,
  onOpenRules
}) => {
  const theme = COLOR_THEMES[colorTheme];
  const tr = t(language);

  return (
    <header className="w-full max-w-2xl mx-auto flex items-center justify-between p-4 mb-2">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.textPrimary} flex items-center gap-2`}>
          <span className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            {tr.appTitle}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium border border-rose-500/30">
            {language === 'bn' ? 'কাটা-কুটি' : 'X & O'}
          </span>
        </h1>
        <p className={`text-xs ${theme.textSecondary}`}>{tr.subtitle}</p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sound toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleSound();
          }}
          id="sound-toggle-btn"
          title={tr.sound}
          className={`p-2 rounded-xl transition-all duration-200 border ${
            soundEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'
          }`}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Language switch */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleLanguage();
          }}
          id="language-switch-btn"
          title={tr.language}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 transition-all flex items-center gap-1"
        >
          <Globe size={14} />
          <span>{language === 'bn' ? 'EN' : 'বাংলা'}</span>
        </button>

        {/* Stats */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenStats();
          }}
          id="stats-btn"
          title={tr.stats}
          className="p-2 rounded-xl border bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800 transition-all"
        >
          <BarChart3 size={18} />
        </button>

        {/* Rules */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenRules();
          }}
          id="rules-btn"
          title={tr.howToPlay}
          className="p-2 rounded-xl border bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800 transition-all"
        >
          <HelpCircle size={18} />
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenSettings();
          }}
          id="settings-btn"
          title={tr.settings}
          className="p-2 rounded-xl border bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800 transition-all"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
