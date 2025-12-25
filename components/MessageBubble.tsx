import React, { useState } from 'react';
import { Message, Sender, UniversityProfile } from '../types';
import { Bot, User, MapPin } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import MapComponent from './MapComponent';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  message: Message;
  university: UniversityProfile;
}

const UniversityAvatar: React.FC<{ university: UniversityProfile }> = ({ university }) => {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-sm">{university.logoEmoji}</span>;
  }
  
  return (
    <img 
      src={university.logoPath} 
      alt={`${university.shortName} logo`}
      className="w-5 h-5 object-contain"
      onError={() => setImgError(true)}
    />
  );
};

const MessageBubble: React.FC<Props> = ({ message, university }) => {
  const isUser = message.sender === Sender.USER;
  const { theme } = useTheme();
  
  // Dynamic color mapping helper
  const getThemeColor = (colorName: string) => {
      const map: Record<string, string> = {
          'amber-500': 'bg-amber-500',
          'blue-700': 'bg-blue-700',
          'red-800': 'bg-red-800',
          'purple-700': 'bg-purple-700',
          'red-600': 'bg-red-600',
          'blue-500': 'bg-blue-500',
      };
      return map[colorName] || 'bg-gray-800';
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[95%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center shadow-sm ${
          isUser 
            ? (theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200')
            : getThemeColor(university.themeColor) + ' text-white'
        }`}>
          {isUser ? <User size={16} className={theme === 'dark' ? 'text-slate-300' : 'text-gray-600'} /> : <UniversityAvatar university={university} />}
        </div>

        {/* Content Container */}
        <div className={`flex flex-col space-y-2 w-full`}>
            {/* Bubble */}
            <div className={`px-5 py-4 rounded-md shadow-sm ${
            isUser 
                ? (theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-gray-900 text-white')
                : (theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'bg-white border border-gray-100 text-gray-800')
            }`}>
            {isUser ? (
                <p className="text-sm">{message.text}</p>
            ) : (
                <div>
                    <p className={`text-xs font-bold mb-1 uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>{university.personaName}</p>
                    <MarkdownRenderer content={message.text} />
                </div>
            )}
            </div>

            {/* Interactive Map Embed */}
            {!isUser && message.mapLocation && (
                <div className={`p-2 rounded-md border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-2 px-2 pt-1">
                        <MapPin size={14} className={`text-${university.themeColor}`} />
                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Location: {message.mapLocation.name}</span>
                    </div>
                    <MapComponent 
                        lat={message.mapLocation.lat} 
                        lng={message.mapLocation.lng} 
                        locationName={message.mapLocation.name} 
                    />
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;