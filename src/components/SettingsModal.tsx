import React from 'react';
import { X, Palette, Sparkles, Volume2, Globe, FileText } from 'lucide-react';
import { ColorTheme, Language, SymbolTheme } from '../types';
import { COLOR_THEMES, SYMBOL_PAIRS } from '../utils/themes';
import { t } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  language: Language;
  soundEnabled: boolean;
  colorTheme: ColorTheme;
  symbolTheme: SymbolTheme;
  onClose: () => void;
  onSelectLanguage: (lang: Language) => void;
  onToggleSound: () => void;
  onSelectColorTheme: (theme: ColorTheme) => void;
  onSelectSymbolTheme: (sym: SymbolTheme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  language,
  soundEnabled,
  colorTheme,
  symbolTheme,
  onClose,
  onSelectLanguage,
  onToggleSound,
  onSelectColorTheme,
  onSelectSymbolTheme
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
            <Palette className="text-indigo-400" size={22} />
            <span>{tr.settings}</span>
          </h2>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            id="close-settings-btn"
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Language selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe size={15} className="text-indigo-400" />
              <span>{tr.language}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onSelectLanguage('bn');
                }}
                id="lang-bn-btn"
                className={`py-2 rounded-xl font-bold border transition-all ${
                  language === 'bn'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                বাংলা (Bengali)
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onSelectLanguage('en');
                }}
                id="lang-en-btn"
                className={`py-2 rounded-xl font-bold border transition-all ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Symbol Set Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles size={15} className="text-amber-400" />
              <span>{tr.symbols}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SYMBOL_PAIRS.map(pair => (
                <button
                  key={pair.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectSymbolTheme(pair.id);
                  }}
                  id={`symbol-theme-${pair.id}-btn`}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    symbolTheme === pair.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs truncate">
                    {language === 'bn' ? pair.nameBn : pair.nameEn}
                  </div>
                  <div className="text-lg font-black mt-1 flex items-center gap-2">
                    <span>{pair.xIcon}</span>
                    <span className="text-xs text-slate-400">vs</span>
                    <span>{pair.oIcon}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Themes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Palette size={15} className="text-emerald-400" />
              <span>{tr.theme}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(COLOR_THEMES).map(th => (
                <button
                  key={th.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectColorTheme(th.id);
                  }}
                  id={`color-theme-${th.id}-btn`}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    colorTheme === th.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">
                    {language === 'bn' ? th.nameBn : th.nameEn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Effect Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-indigo-400" />
              <span className="font-bold text-slate-200">{tr.sound}</span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleSound();
              }}
              id="settings-sound-toggle"
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                soundEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? tr.on : tr.off}
            </button>
          </div>

          {/* PRD prompt box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
              <FileText size={15} />
              <span>{tr.prdPromptTitle}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {tr.prdPromptText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
