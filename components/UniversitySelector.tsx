import React, { useState } from 'react';
import { UniversityProfile } from '../types';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  universities: UniversityProfile[];
  selectedId: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const UniversityLogo: React.FC<{ uni: UniversityProfile; size?: number }> = ({ uni, size = 24 }) => {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-xl">{uni.logoEmoji}</span>;
  }
  
  return (
    <img 
      src={uni.logoPath} 
      alt={`${uni.shortName} logo`}
      className="university-logo"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
};

const UniversitySelector: React.FC<Props> = ({ universities, selectedId, onSelect, isOpen, setIsOpen }) => {
  const selectedUni = universities.find(u => u.id === selectedId) || universities[0];
  const { theme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md shadow-sm transition-colors border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
      >
        <UniversityLogo uni={selectedUni} size={24} />
        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{selectedUni.shortName}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full right-0 mt-2 w-64 rounded-md shadow-xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
          theme === 'dark' ? 'bg-black border-slate-800' : 'bg-white border-gray-100'
        }`}>
          <div className="py-1">
            {universities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => {
                  onSelect(uni.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors border-l-4 ${
                  selectedId === uni.id 
                    ? `border-${uni.themeColor} ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}` 
                    : `border-transparent ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`
                }`}
              >
                <UniversityLogo uni={uni} size={28} />
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{uni.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{uni.personaName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversitySelector;