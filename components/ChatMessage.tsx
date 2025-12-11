import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Loader2, Copy, Check, Volume2, Square, ExternalLink, RefreshCw, Wand2, ZoomIn, Layout, Edit2 } from 'lucide-react';
import { ChatMessage as ChatMessageType, ActionType } from '../types';
import { generateTutorSpeech } from '../services/geminiService';
// @ts-ignore
import mermaid from 'mermaid';

interface ChatMessageProps {
  message: ChatMessageType;
  subjectColor: string;
  highlightText?: string;
  onAction?: (type: ActionType, content: string) => void;
}

// Mermaid Diagram Component
const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        const isDark = document.documentElement.classList.contains('dark');
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif'
        });

        const trimmedCode = code.trim();
        const isFlowchart = trimmedCode.startsWith('graph') || trimmedCode.startsWith('flowchart');
        
        let sanitizedCode = trimmedCode;

        // Sanitization Logic (Only for Flowcharts to avoid breaking Class Diagrams)
        if (isFlowchart) {
            // 1. Handle Multi-line labels inside quotes: ["Line 1\nLine 2"] -> ["Line 1<br/>Line 2"]
            sanitizedCode = sanitizedCode.replace(/\["([\s\S]*?)"\]/g, (match, content) => {
                return `["${content.replace(/\n/g, '<br/>')}"]`;
            });
            
             // 2. Fix unquoted labels with parentheses/brackets
             sanitizedCode = sanitizedCode
                .replace(/(\w+)\(([^")\n]+)\)/g, '$1("$2")')
                .replace(/(\w+)\[([^"\]\n]+)\]/g, '$1["$2"]');
        }

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, sanitizedCode);
        
        if (isMounted) {
            setSvg(svg);
            setError(false);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
            setError(true);
        }
      }
    };

    if (code) {
      renderDiagram();
    }
    
    return () => {
        isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm font-mono border border-red-200 dark:border-red-800">
        <p className="font-semibold mb-1">Diagram render failed</p>
        <p className="opacity-80 mb-2">The AI generated invalid syntax. Retrying might help.</p>
        <details>
             <summary className="cursor-pointer text-xs opacity-75">View Code</summary>
             <pre className="mt-2 text-xs opacity-75 whitespace-pre-wrap">{code}</pre>
        </details>
      </div>
    );
  }

  return (
    <div 
        ref={containerRef}
        className="my-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto flex justify-center shadow-inner"
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
           <Loader2 className="animate-spin h-4 w-4" />
           <span>Generating diagram...</span>
        </div>
      )}
    </div>
  );
};

const PreBlock = ({ children, node, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const codeChild = React.Children.toArray(children)[0] as any;
  const className = codeChild?.props?.className || '';
  const isMermaid = className.includes('language-mermaid');

  if (isMermaid) {
    const chartCode = codeChild.props.children; 
    return <MermaidDiagram code={String(chartCode).trim()} />;
  }

  const handleCopy = async () => {
    if (!preRef.current) return;
    const text = preRef.current.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative group my-4">
      <pre 
        ref={preRef} 
        {...props}
        className={`${props.className || ''} !pr-12`}
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code"
        title="Copy code"
      >
        {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
      </button>
    </div>
  );
};

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const pcmToAudioBuffer = (pcmData: Uint8Array, audioContext: AudioContext) => {
    if (pcmData.length % 2 !== 0) {
        pcmData = pcmData.subarray(0, pcmData.length - 1);
    }
    const alignedBuffer = pcmData.buffer.slice(pcmData.byteOffset, pcmData.byteOffset + pcmData.byteLength);
    const int16Array = new Int16Array(alignedBuffer);
    const buffer = audioContext.createBuffer(1, int16Array.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
    }
    return buffer;
};

const highlightTextInNode = (node: React.ReactNode, query: string): React.ReactNode => {
  if (!query) return node;

  if (typeof node === 'string') {
    const parts = node.split(new RegExp(`(${query})`, 'gi'));
    return parts.length > 1 ? (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span 
              key={i} 
              className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-100 rounded px-0.5"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    ) : (
      node
    );
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    const children = React.Children.map(element.props.children, child => 
      highlightTextInNode(child, query)
    );
    return React.cloneElement(element, { ...element.props, children } as any);
  }

  if (Array.isArray(node)) {
      return node.map((child, i) => <React.Fragment key={i}>{highlightTextInNode(child, query)}</React.Fragment>);
  }

  return node;
};

export const ChatMessage = React.memo<ChatMessageProps>(({ message, subjectColor, highlightText, onAction }) => {
  const isUser = message.role === 'user';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    return () => {
      if (sourceRef.current) sourceRef.current.stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }
    setPlaybackError(false);
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      if (!audioBufferRef.current) {
        setIsLoadingAudio(true);
        const base64Audio = await generateTutorSpeech(message.text);
        if (!base64Audio) throw new Error("No audio data received");
        const audioBytes = decodeBase64(base64Audio);
        try {
            audioBufferRef.current = pcmToAudioBuffer(audioBytes, audioContextRef.current);
        } catch (e) {
             throw new Error("PCM Decode Error: " + e);
        }
        setIsLoadingAudio(false);
      }
      if (audioBufferRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        sourceRef.current = source;
        source.start();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
      setPlaybackError(true);
    }
  };

  const markdownComponents = useMemo(() => {
    const HighlightRenderer = ({ children, ...props }: any) => {
        if (!highlightText) {
            return React.createElement(props.node.tagName, props, children);
        }
        return React.createElement(props.node.tagName, props, highlightTextInNode(children, highlightText));
    };

    return {
      pre: PreBlock,
      p: HighlightRenderer,
      li: HighlightRenderer,
      h1: HighlightRenderer,
      h2: HighlightRenderer,
      h3: HighlightRenderer,
      h4: HighlightRenderer,
      blockquote: HighlightRenderer,
      strong: HighlightRenderer,
      em: HighlightRenderer
    };
  }, [highlightText]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : `${subjectColor} text-white`}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full min-w-0`}>
          <div 
            className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed w-full transition-all ${
              isUser 
                ? 'bg-slate-800 dark:bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
            }`}
          >
            {message.imageUrl && (
              <div className="mb-3 max-w-full">
                <img 
                  src={message.imageUrl} 
                  alt="User uploaded content" 
                  className="rounded-lg max-h-60 object-contain border border-slate-700/50"
                />
              </div>
            )}
            
            {message.isStreaming && !message.text ? (
              <div className="flex items-center gap-2 text-slate-400 italic">
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Thinking...</span>
              </div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.text}
                </ReactMarkdown>
                
                {/* Sources Section */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                        <span>Sources & Citations</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 text-xs rounded-md transition-all border border-slate-200 dark:border-slate-600 hover:border-indigo-100 max-w-full"
                          title={source.title}
                        >
                          <ExternalLink size={10} />
                          <span className="truncate max-w-[150px]">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 px-1 min-h-[24px]">
            <span className="text-xs text-slate-400 font-medium">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {!isUser && !message.isStreaming && (
              <div className="flex items-center gap-2 opacity-100 transition-opacity duration-200">
                {/* Audio Button */}
                <button
                  onClick={handlePlayAudio}
                  disabled={isLoadingAudio}
                  className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                    playbackError 
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'
                  }`}
                  title={playbackError ? "Retry Audio" : isPlaying ? "Stop Audio" : "Play Audio"}
                >
                  {isLoadingAudio ? <Loader2 size={13} className="animate-spin" /> : 
                   playbackError ? <RefreshCw size={13} /> : 
                   isPlaying ? <Square size={13} className="fill-current" /> : 
                   <Volume2 size={13} />}
                </button>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                {/* Smart Actions Toolbar */}
                <button
                  onClick={() => onAction && onAction('simplify', message.text)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  title="Explain in simpler terms"
                >
                  <Wand2 size={12} />
                  <span>Simplify</span>
                </button>

                <button
                  onClick={() => onAction && onAction('elaborate', message.text)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  title="Provide detailed examples"
                >
                  <ZoomIn size={12} />
                  <span>Deep Dive</span>
                </button>

                <button
                  onClick={() => onAction && onAction('visualize', message.text)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  title="Generate a diagram for this"
                >
                  <Layout size={12} />
                  <span>Visualize</span>
                </button>
              </div>
            )}

            {isUser && !message.isStreaming && (
                <button
                  onClick={() => onAction && onAction('edit', message.text)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Edit message"
                >
                    <Edit2 size={12} />
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});