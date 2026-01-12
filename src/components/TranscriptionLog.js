import { useEffect, useRef } from 'react';
import { User, Sparkles } from 'lucide-react';

/**
 * Simple markdown parser for basic formatting
 * @param {string} text - Text to parse
 * @returns {string} - HTML string
 */
function parseMarkdown(text) {
  if (!text) return '';

  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(?!\*)(.*?)\*(?!\*)/g, '<em>$1</em>')
    .replace(/_(?!_)(.*?)_(?!_)/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />');
}

/**
 * Displays conversation transcription log
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 */
function TranscriptionLog({ messages }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
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
            <p
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
            />
          </div>

          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
              <User size={16} className="text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TranscriptionLog;
