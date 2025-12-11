import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Image as ImageIcon, X, Menu, Trash2, Mic, MicOff, Search, ArrowLeft, Sun, Moon, Zap, Languages, Download, FileText } from 'lucide-react';
import { SUBJECTS } from './constants';
import { Subject, ChatMessage, Role, ActionType } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatMessage as ChatMessageComponent } from './components/ChatMessage';
import { streamTutorResponse } from './services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { AuthPage } from './components/AuthPage';
import { SupportModal } from './components/SupportModal';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Password Reset Deep Link State (Simulated)
  const [isResetMode, setIsResetMode] = useState(false);

  const [activeSubject, setActiveSubject] = useState<Subject>(SUBJECTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'en-US' | 'hi-IN'>('en-US'); 
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef(''); 
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Concise Mode State
  const [isConciseMode, setIsConciseMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Local Auth State
  useEffect(() => {
    const storedUser = localStorage.getItem('cognitutor_active_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
    }
    setIsAuthLoading(false);
  }, []);

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const stopRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
      };

      const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(stopRecognition, 2500);
      };

      recognition.onstart = () => {
         if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
         silenceTimerRef.current = setTimeout(stopRecognition, 5000); 
      };

      recognition.onresult = (event: any) => {
        resetSilenceTimer(); 
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const currentBase = baseTextRef.current;
        const spacer = currentBase && !currentBase.endsWith(' ') && transcript ? ' ' : '';
        setInputValue(currentBase + spacer + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (isAuthenticated) {
        setMessages([{
            id: 'welcome',
            role: 'model',
            text: activeSubject.welcomeMessage,
            timestamp: Date.now()
        }]);
        setInputValue('');
        setSelectedImage(null);
        setSearchQuery('');
        setIsSearchOpen(false);
    }
  }, [activeSubject, isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!searchQuery) {
      scrollToBottom();
    }
  }, [messages, searchQuery, isSearchOpen]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearImage = () => setSelectedImage(null);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    } else {
      recognitionRef.current.lang = speechLanguage;
      baseTextRef.current = inputValue;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleSpeechLanguage = () => {
    setSpeechLanguage(prev => prev === 'en-US' ? 'hi-IN' : 'en-US');
  };

  const handleLoginSuccess = () => {
      const user = localStorage.getItem('cognitutor_active_user');
      if (user) {
          setCurrentUser(JSON.parse(user));
          setIsAuthenticated(true);
          setIsResetMode(false);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('cognitutor_active_user');
      setIsAuthenticated(false);
      setCurrentUser(null);
  };

  // Reusable function to send message to API
  const sendToAI = async (text: string, imageUrl?: string | null) => {
    if (isLoading) return;

    // Add user message to state
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      imageUrl: imageUrl || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }] 
      }));

      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        text: '',
        timestamp: Date.now(),
        isStreaming: true
      }]);

      let imageData = undefined;
      if (imageUrl) {
          const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
          if (matches && matches.length === 3) {
              imageData = {
                  mimeType: matches[1],
                  base64: matches[2]
              };
          }
      }

      const systemInstruction = isConciseMode 
        ? activeSubject.systemInstruction + "\n\nCRITICAL INSTRUCTION: The user has enabled 'Concise Mode'. Provide short, direct answers. Focus ONLY on the core concept/definition. Avoid lengthy introductions."
        : activeSubject.systemInstruction;

      const stream = await streamTutorResponse(
        userMessage.text,
        systemInstruction,
        imageData,
        history
      );

      let fullText = '';
      let collectedSources: { title: string; url: string }[] = [];
      
      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
        }

        const groundingChunks = (chunk as GenerateContentResponse).candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
          groundingChunks.forEach((gChunk: any) => {
            if (gChunk.web) {
              if (!collectedSources.some(s => s.url === gChunk.web.uri)) {
                collectedSources.push({
                  title: gChunk.web.title || 'Source',
                  url: gChunk.web.uri
                });
              }
            }
          });
        }

        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { 
                  ...msg, 
                  text: fullText,
                  sources: collectedSources.length > 0 ? collectedSources : undefined
                } 
              : msg
          )
        );
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm sorry, I encountered an error while thinking about that. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery('');
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    }

    const textToSend = inputValue;
    const imageToSend = selectedImage;

    // Reset Input
    setInputValue('');
    setSelectedImage(null);

    await sendToAI(textToSend, imageToSend);
  };

  const handleAction = async (type: ActionType, content: string) => {
    if (type === 'edit') {
        setInputValue(content);
        return;
    }

    // Smart Prompts based on Action Type
    let prompt = "";
    if (type === 'simplify') {
        prompt = `Please rewrite the previous explanation in extremely simple terms, as if explaining to a beginner or 10-year-old. Keep it brief. Context: "${content.substring(0, 100)}..."`;
    } else if (type === 'elaborate') {
        prompt = `Please elaborate on the previous concept with more detailed examples, analogies, and a deeper technical breakdown. Context: "${content.substring(0, 100)}..."`;
    } else if (type === 'visualize') {
        prompt = `Please generate a Mermaid.js diagram (Flowchart, Sequence Diagram, or Mind Map) to visualize the concept explained in the previous message. Return ONLY the code block and a brief title. Context: "${content.substring(0, 100)}..."`;
    }

    await sendToAI(prompt);
  };

  const handleExportChat = () => {
    const chatContent = messages.map(m => {
        return `**${m.role === 'user' ? 'You' : activeSubject.name}** (${new Date(m.timestamp).toLocaleTimeString()}):\n${m.text}\n\n`;
    }).join('---\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CogniTutor-${activeSubject.name}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if(window.confirm("Are you sure you want to clear this study session?")) {
        setMessages([{
            id: Date.now().toString(),
            role: 'model',
            text: activeSubject.welcomeMessage,
            timestamp: Date.now()
        }]);
        setSearchQuery('');
        setIsSearchOpen(false);
    }
  };

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (msg.sources && msg.sources.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : messages;

  if (isAuthLoading) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
              <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="mt-4 text-slate-500">Initializing CogniTutor...</p>
              </div>
          </div>
      );
  }

  if (!isAuthenticated) {
      return (
          <AuthPage 
            onLogin={handleLoginSuccess} 
            resetMode={isResetMode}
            onSetResetMode={setIsResetMode}
          />
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <Sidebar 
        subjects={SUBJECTS} 
        activeSubject={activeSubject} 
        onSelectSubject={setActiveSubject} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        onOpenSupport={() => setIsSupportOpen(true)}
        userEmail={currentUser?.email}
      />

      <SupportModal 
        isOpen={isSupportOpen} 
        onClose={() => setIsSupportOpen(false)} 
        userEmail={currentUser?.email}
      />

      <div className="flex-1 flex flex-col h-full w-full relative">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10 transition-all">
          {isSearchOpen ? (
            <div className="flex items-center w-full gap-3 animate-fadeIn">
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Close search"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in conversation..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-4 py-2 pr-10 border-none focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <Menu size={24} />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {activeSubject.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                   onClick={() => setIsConciseMode(!isConciseMode)}
                   className={`p-2 rounded-full transition-colors ${
                     isConciseMode 
                       ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30' 
                       : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-slate-800'
                   }`}
                   title={isConciseMode ? "Disable Concise Mode" : "Enable Concise Mode (Short Answers)"}
                 >
                   <Zap size={20} className={isConciseMode ? "fill-current" : ""} />
                 </button>
                
                <button 
                  onClick={handleExportChat}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
                  title="Export Chat as Notes (Markdown)"
                >
                  <Download size={20} />
                </button>

                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                  title="Search messages"
                >
                  <Search size={20} />
                </button>
                <button 
                  onClick={toggleTheme}
                  className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={clearChat}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </>
          )}
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto pb-4">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <ChatMessageComponent 
                  key={msg.id} 
                  message={msg} 
                  subjectColor={activeSubject.color}
                  highlightText={searchQuery}
                  onAction={handleAction}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No messages found for "{searchQuery}"</p>
                <button 
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                >
                  Clear search
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 lg:px-8 lg:py-6 flex-shrink-0 z-20 ${isSearchOpen ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedImage && (
                <div className="relative inline-block animate-fadeIn">
                  <img src={selectedImage} alt="Preview" className="h-16 w-auto rounded-lg border border-slate-300 dark:border-slate-600" />
                  <button 
                    onClick={clearImage}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                title="Upload image"
              >
                <ImageIcon size={22} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />

              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden self-stretch items-center">
                 <button 
                    onClick={toggleSpeechLanguage}
                    className="px-2 text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 h-full transition-colors flex items-center gap-1"
                    title={`Current Speech Language: ${speechLanguage === 'en-US' ? 'English' : 'Hindi'}`}
                  >
                    <Languages size={14} />
                    {speechLanguage === 'en-US' ? 'EN' : 'HI'}
                 </button>
                 <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600"></div>
                 <button 
                    onClick={toggleListening}
                    className={`p-3 transition-all ${
                        isListening 
                        ? 'bg-red-50 text-red-600 animate-pulse dark:bg-red-900/20 dark:text-red-400' 
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
              </div>
              
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedImage ? "Ask something about this content..." : (isListening ? (speechLanguage === 'hi-IN' ? "Listening (Hindi)..." : "Listening (English)...") : `Ask your ${activeSubject.name}${activeSubject.name.toLowerCase().endsWith('tutor') ? '' : ' tutor'} anything...`)}
                className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none max-h-32 min-h-[48px]"
                rows={1}
                style={{ minHeight: '3rem' }} 
              />
              
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className={`p-3 rounded-xl transition-all shadow-sm ${
                    isLoading || (!inputValue.trim() && !selectedImage)
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow hover:scale-105 active:scale-95'
                }`}
              >
                <Send size={22} />
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
              CogniTutor can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;