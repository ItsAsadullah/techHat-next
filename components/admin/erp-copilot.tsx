'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Send, Loader2, CheckCircle2, ChevronRight, X, Sparkles, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getDynamicAiModels } from '@/lib/actions/setting-actions';

interface ErpCopilotProps {
  staffRole: string;
  staffName: string;
  onClose?: () => void;
}

export function ErpCopilot({ staffRole, staffName, onClose }: ErpCopilotProps) {
  const pathname = usePathname();
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [model, setModel] = useState<string>('gemini');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch models on mount
  useEffect(() => {
    getDynamicAiModels().then(models => {
      setAiModels(models);
      if (models.length > 0) setModel(models[0].id);
    }).catch(console.error);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages, 
          model,
          context: {
            pathname,
            staffRole,
            staffName
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');
      
      const decoder = new TextDecoder();
      const assistantId = (Date.now() + 1).toString();
      let assistantContent = '';
      
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantContent += decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex].id === assistantId) {
            updated[lastIndex] = { ...updated[lastIndex], content: assistantContent };
          }
          return updated;
        });
      }
      
      if (!assistantContent.trim()) {
        throw new Error("The AI model returned an empty response. This is usually caused by API rate limits or model unavailability.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render message content and intercept preview cards
  const renderMessageContent = (m: any) => {
    if (m.role === 'user') return m.content;

    let text = m.content || '';
    
    // Look for Journal Validation Preview JSON
    if (text.includes('```json') && text.includes('"action": "validation_preview"')) {
      const cleanText = text.split('```json')[0].trim();
      const presentationText = cleanText.replace(/\s*\(?(?:ID:\s*)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\)?/ig, '');
      
      let payload: any = null;
      try {
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) payload = JSON.parse(jsonMatch[1]);
      } catch (e) { }

      if (payload) {
        return (
          <div className="space-y-3 w-full">
            {presentationText && <div className="whitespace-pre-wrap">{presentationText}</div>}
            
            <div className="bg-white border border-indigo-100 rounded-lg overflow-hidden shadow-sm text-xs">
              <div className="bg-indigo-50/50 px-3 py-2 border-b border-indigo-100 flex justify-between items-center">
                <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Journal Preview
                </span>
                {payload.confidence && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                    {payload.confidence} Confidence
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span>Total Debit</span>
                  <span className="font-medium">৳{payload.totalDebit?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span>Total Credit</span>
                  <span className="font-medium">৳{payload.totalCredit?.toLocaleString() || 0}</span>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button size="sm" className="w-full h-7 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                    window.dispatchEvent(new CustomEvent('ai-fill-journal', { detail: payload }));
                  }}>
                    Fill Form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="space-y-3 w-full">
            {presentationText && <div className="whitespace-pre-wrap">{presentationText}</div>}
            <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50/30 text-xs text-indigo-500 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4" /> Generating preview...
            </div>
          </div>
        );
      }
    }
    
    text = text.replace(/\s*\(?(?:ID:\s*)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\)?/ig, '');
    return <div className="whitespace-pre-wrap">{text}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 w-full relative">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">ERP Copilot</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-7 w-[110px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 focus:ring-0">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {aiModels.length > 0 ? (
                aiModels.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" 
            onClick={() => setMessages([])}
            title="Clear Chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full" onClick={onClose} title="Hide Copilot">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-gray-900/30">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100">TechHat AI Copilot</p>
            <p className="mt-1 text-xs max-w-[200px] mx-auto text-gray-500">
              I'm aware of your current context. Ask me to create journals, fetch reports, or analyze data.
            </p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            
            <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-sm' 
                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-bl-sm text-gray-700 dark:text-gray-200'
            }`}>
              {renderMessageContent(m)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-bl-sm text-gray-500 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Thinking...
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-3 rounded-xl text-xs bg-red-50 text-red-700 border border-red-100">
            {error.message || 'Something went wrong'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot..."
              className="pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full h-10 text-sm focus-visible:ring-indigo-500"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="absolute right-1 top-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex justify-center gap-2 text-[10px] font-medium text-gray-400">
            <span>Press Enter to send</span>
          </div>
        </form>
      </div>
    </div>
  );
}
