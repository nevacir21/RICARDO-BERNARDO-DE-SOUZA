
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage, AgendaEvent } from '../types';
import { getGeminiResponse, extractEventData } from '../services/geminiService';

interface AssistantPanelProps {
  events: AgendaEvent[];
  onEventCreated: (event: Partial<AgendaEvent>) => void;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ events, onEventCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Olá! Como posso ajudar você hoje? Posso agendar compromissos, resumir seu dia ou sugerir horários para suas tarefas.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const currentInput = input;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));

    try {
      const eventExtraction = await extractEventData(currentInput);
      if (eventExtraction && eventExtraction.isEvent) {
        onEventCreated({
          title: eventExtraction.title,
          start: eventExtraction.start ? new Date(eventExtraction.start) : new Date(),
          end: eventExtraction.end ? new Date(eventExtraction.end) : new Date(Date.now() + 3600000),
          priority: eventExtraction.priority || 'medium',
          category: eventExtraction.category || 'other',
          description: eventExtraction.description || ''
        });
      }
    } catch (e) {
      console.error('Event extraction failed', e);
    }

    const aiText = await getGeminiResponse(currentInput, events, history);
    
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-900/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Elite AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ready to help</span>
            </div>
          </div>
        </div>
        <Sparkles size={20} className="text-indigo-400 dark:text-indigo-500" />
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700 dark:text-slate-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
              }`}>
                {msg.content}
                <div className={`text-[10px] mt-1 opacity-70 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-medium">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20 rounded-b-2xl">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ex: 'Marque reunião amanhã às 10h'"
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-2 rounded-lg transition-all ${
                input.trim() && !isTyping ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;
