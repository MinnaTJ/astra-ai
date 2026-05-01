import React, { useEffect, useRef } from 'react';
import { User, Sparkles } from 'lucide-react';

/**
 * Safe React-based markdown renderer (no dangerouslySetInnerHTML)
 * Handles bold, italic, and line breaks
 * @param {string} text - Text to render
 * @returns {React.ReactNode[]} - Array of React elements
 */
function renderMarkdown(text) {
  if (!text) return null;

  // Split by newlines first, then process inline formatting
  return text.split('\n').map((line, lineIdx, lines) => {
    const parts = [];
    // Match **bold**, __bold__, *italic*, _italic_
    const regex = /(\*\*(.*?)\*\*|__(.*?)__|(?<!\*)\*(?!\*)(.*?)\*(?!\*)|(?<!_)_(?!_)(.*?)_(?!_))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Text before the match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      if (match[2] !== undefined) {
        // **bold**
        parts.push(<strong key={`b-${lineIdx}-${match.index}`}>{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        // __bold__
        parts.push(<strong key={`b-${lineIdx}-${match.index}`}>{match[3]}</strong>);
      } else if (match[4] !== undefined) {
        // *italic*
        parts.push(<em key={`i-${lineIdx}-${match.index}`}>{match[4]}</em>);
      } else if (match[5] !== undefined) {
        // _italic_
        parts.push(<em key={`i-${lineIdx}-${match.index}`}>{match[5]}</em>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    if (parts.length === 0) {
      parts.push(line);
    }

    // Add line break between lines (not after the last one)
    if (lineIdx < lines.length - 1) {
      parts.push(<br key={`br-${lineIdx}`} />);
    }

    return <React.Fragment key={lineIdx}>{parts}</React.Fragment>;
  });
}

/**
 * Displays conversation transcription log
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 */
function TranscriptionLog({ messages, isThinking }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 italic">
        Conversation transcript will appear here...
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
        >
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles size={16} className="text-white" />
            </div>
          )}

          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white/10 text-gray-100 border border-white/5 rounded-tl-none'
              }`}
          >
            <p className="leading-relaxed">
              {renderMarkdown(msg.text)}
            </p>
          </div>

          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
              <User size={16} className="text-white" />
            </div>
          )}
        </div>
      ))}

      {isThinking && (
        <div className="flex items-start gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="bg-white/10 text-gray-400 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2 text-sm flex items-center gap-1.5">
            <div className="flex gap-1 items-center h-4">
              <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-duration:0.8s]" />
              <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
            </div>
            <span className="text-xs font-medium">Astra is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TranscriptionLog;
