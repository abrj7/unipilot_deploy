import React, { useState } from 'react';
import { UniversityProfile } from '../types';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FaqItem {
    question: string;
    answer: string;
}

interface Props {
    faq: FaqItem[];
    university: UniversityProfile;
}

const FaqTab: React.FC<Props> = ({ faq, university }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme } = useTheme();

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const filteredFaq = faq.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header Section */}
            <div className="mb-6">
                <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    <HelpCircle className={`text-${university.themeColor}`} />
                    Frequently Asked Questions
                </h2>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                    Quick answers to common questions about {university.shortName}.
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-slate-600'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-${university.themeColor}/20`}
                    />
                </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
                {filteredFaq.length === 0 ? (
                    <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                        <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No FAQs found matching your search.</p>
                    </div>
                ) : (
                    filteredFaq.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className={`rounded-xl border overflow-hidden transition-all ${theme === 'dark'
                                        ? `bg-slate-800 border-slate-700 ${isOpen ? 'shadow-lg shadow-slate-900/50' : ''}`
                                        : `bg-white border-gray-100 ${isOpen ? 'shadow-md' : 'shadow-sm'}`
                                    }`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className={`w-full flex items-center justify-between p-5 text-left transition-colors ${theme === 'dark'
                                            ? 'hover:bg-slate-700/50'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={`font-semibold pr-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {item.question}
                                    </span>
                                    <span className={`flex-shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
                                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </span>
                                </button>

                                {isOpen && (
                                    <div className={`px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-200`}>
                                        <div className={`pt-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'}`}>
                                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {item.answer}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Stats */}
            {filteredFaq.length > 0 && (
                <div className={`mt-6 text-center text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                    {searchQuery ? (
                        <span>Showing {filteredFaq.length} of {faq.length} FAQs</span>
                    ) : (
                        <span>{faq.length} FAQs available</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default FaqTab;
