import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Project, Task, User } from '../types';
import { useI18n } from '../context/I18nContext';
import XIcon from './icons/XIcon';
import SparklesIcon from './icons/SparklesIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  users: User[];
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, projects, tasks, users }) => {
    const { t } = useI18n();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = useMemo(() => {
        const dataSnapshot = {
            projects: projects.map(({ id, name, startDate, endDate }) => ({ id, name, startDate, endDate })),
            tasks: tasks.map(({ id, name, projectId, status, assignedWorkerIds, startDate, deadline }) => ({ id, name, projectId, status, assignedWorkerIds, startDate, deadline })),
            users: users.map(({ id, name, role, skills }) => ({ id, name, role, skills })),
        };

        return `${t('aiChat_systemInstruction_part1')} ${t('aiChat_systemInstruction_part2')}\n\n${t('aiChat_systemInstruction_part3')}\n\`\`\`json\n${JSON.stringify(dataSnapshot, null, 2)}\n\`\`\``;
    }, [projects, tasks, users, t]);

    useEffect(() => {
        if (isOpen) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: systemInstruction,
                    },
                });
                setChat(newChat);
                setMessages([]);
                setInput('');
            } catch (error) {
                console.error("Failed to initialize AI Chat:", error);
                setMessages([{ role: 'model', text: 'Error: Could not initialize AI Assistant.'}]);
            }
        }
    }, [isOpen, systemInstruction]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseStream = await chat.sendMessageStream({ message: userMessage.text });
            
            let currentModelMessage = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of responseStream) {
                currentModelMessage += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: currentModelMessage };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('AI chat error:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-end sm:items-center z-[100] p-0 sm:p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-[90%] sm:h-[85%] flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('aiChat_title')}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('close')}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-prose p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder={t('aiChat_placeholder')}
                            className="flex-grow p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading} className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition disabled:bg-blue-400 disabled:cursor-not-allowed flex-shrink-0">
                            <PaperAirplaneIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;