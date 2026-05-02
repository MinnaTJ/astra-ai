import React, { useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  X,
  Send,
  Loader2,
  MessageSquareText,
  Trash2
} from 'lucide-react';
import { AssistantState } from '@/constants';
import { sendTextMessage } from '@/services';
import { useVoiceSession } from '@/hooks';
import { useJobs, useSettings, useToast } from '@/contexts';
import Waveform from './Waveform';
import TranscriptionLog from './TranscriptionLog';

/**
 * Main assistant interaction view with voice and text chat
 * @param {Object} props - Component props
 * @param {Function} props.onSyncGmail - Gmail sync handler
 * @param {Array} props.messages - Persisted chat messages from parent
 * @param {Function} props.setMessages - Chat messages updater from parent
 */
function AssistantView({ onSyncGmail, messages, setMessages }) {
  const [textInput, setTextInput] = useState('');
  const [isTextThinking, setIsTextThinking] = useState(false);
  const [error, setError] = useState(null);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { settingsRef } = useSettings();
  const { showToast } = useToast();
  const {
    saveJobApplication,
    deleteJobApplication,
    updateJobApplication,
    listJobs,
    findJobByCompany
  } = useJobs();

  // Handle tool calls from voice or text
  const handleToolCall = useCallback(
    async (fc) => {
      let result = '';
      let mutated = false;
      if (fc.name === 'save_job_application') {
        result = saveJobApplication(fc.args);
        mutated = true;
      } else if (fc.name === 'list_job_applications') {
        result = listJobs();
      } else if (fc.name === 'update_job_status' || fc.name === 'update_job_application') {
        // Support both names for transition safety
        result = updateJobApplication(fc.args);
        mutated = true;
      } else if (fc.name === 'delete_job_application') {
        const job = findJobByCompany(fc.args.company);
        result = job
          ? deleteJobApplication(job.id)
          : `Could not find a job for ${fc.args.company}.`;
        mutated = true;
      } else if (fc.name === 'sync_gmail_emails') {
        showToast('Syncing Gmail...', 'info');
        // Add immediate feedback message so user knows the long sync process started
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + '-sync-start',
            role: 'assistant',
            text: '🔄 Syncing your Gmail for job applications... This usually takes about a minute. I will let you know when I am done!',
            timestamp: Date.now()
          }
        ]);
        // Await the full sync so we can report results back to the AI
        result = await onSyncGmail();
        showToast('Gmail sync complete!', 'success');
        mutated = true;
      }
      
      // If we mutated state, give the AI an updated summary so it isn't flying blind
      if (mutated) {
        result += '\n\nCURRENT TRACKER STATE:\n' + listJobs();
      }
      return result;
    },
    [saveJobApplication, deleteJobApplication, updateJobApplication, listJobs, findJobByCompany, onSyncGmail, setMessages, showToast]
  );

  // Handle voice messages
  const handleVoiceMessage = useCallback((userText, assistantText) => {
    if (userText) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-user',
          role: 'user',
          text: userText,
          timestamp: Date.now()
        }
      ]);
    }
    if (assistantText) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          text: assistantText,
          timestamp: Date.now()
        }
      ]);
    }
  }, [setMessages]);

  // Handle errors
  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  // Initialize voice session hook
  const { state, analyser, startSession, stopSession } = useVoiceSession({
    settingsRef,
    onMessage: handleVoiceMessage,
    onToolCall: handleToolCall,
    onError: handleError
  });

  // Cleanup on unmount - ensure session is stopped when navigating away
  React.useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  // Handle text chat submission
  const handleSendText = async (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isTextThinking) return;

    const userMsg = textInput.trim();
    setTextInput('');
    setIsTextThinking(true);

    const newUserMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      text: userMsg,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Pass handleToolCall so the model can execute tools and see results
      const response = await sendTextMessage(userMsg, settingsRef.current, handleToolCall);
      const assistantText = response.text || 'Done! Check your dashboard for updates.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          text: assistantText,
          timestamp: Date.now()
        }
      ]);
    } catch (err) {
      console.error('Text message error:', err);
      setError(err.message || 'Text service unavailable. Check your connection.');
    } finally {
      setIsTextThinking(false);
    }
  };

  const settings = settingsRef.current;

  return (
    <section className="flex-1 flex flex-col md:flex-row h-full overflow-hidden animate-in fade-in duration-300 relative">
      {/* Interaction Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        <div className="z-10 text-center max-w-md w-full flex-1 flex flex-col justify-center">
          {/* Avatar */}
          <div
            className={`w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full flex items-center justify-center transition-all duration-700 relative ${state === AssistantState.SPEAKING
              ? 'bg-blue-500/10 scale-105'
              : state === AssistantState.LISTENING
                ? 'bg-violet-500/10 scale-105'
                : 'bg-gray-800/20'
              }`}
          >
            {(state === AssistantState.LISTENING ||
              state === AssistantState.SPEAKING) && (
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-violet-500" />
              )}
            <div
              className={`p-6 md:p-8 rounded-full transition-all duration-500 ${state === AssistantState.SPEAKING
                ? 'bg-blue-600 shadow-lg shadow-blue-500/20'
                : state === AssistantState.LISTENING
                  ? 'bg-violet-600 shadow-lg shadow-violet-500/20'
                  : 'bg-gray-800'
                }`}
            >
              {state === AssistantState.ERROR ? (
                <AlertCircle size={32} className="md:size-[48px] text-red-400" />
              ) : (
                <Sparkles size={32} className="md:size-[48px] text-white" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <h2 className="mt-4 md:mt-6 text-xl md:text-2xl font-semibold text-white">
            {state === AssistantState.IDLE &&
              (settings.userName
                ? `Hello, ${settings.userName}`
                : 'Ready to track your career')}
            {state === AssistantState.CONNECTING && 'Establishing connection...'}
            {state === AssistantState.LISTENING && "I'm listening..."}
            {state === AssistantState.THINKING && 'Astra is thinking...'}
            {state === AssistantState.SPEAKING && 'Astra is speaking...'}
            {state === AssistantState.ERROR && 'Connection Issue'}
          </h2>

          <p className="mt-2 text-gray-400 text-xs md:text-sm h-4">
            {!error &&
              state === AssistantState.IDLE &&
              'Talk or type to manage your job applications'}
            {error && <span className="text-red-400/80">{error}</span>}
          </p>

          {/* Waveform Visualization */}
          <Waveform state={state} analyser={analyser} />
        </div>

        {/* Chat and Controls Area */}
        <div className="w-full max-w-2xl space-y-4 mb-4">
          {/* Voice Toggle Button */}
          <div className="flex justify-center">
            <div className="glass rounded-full p-1.5 flex items-center gap-2">
              {state === AssistantState.IDLE || state === AssistantState.ERROR ? (
                <button
                  onClick={startSession}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-all active:scale-95 glow shadow-xl"
                >
                  <Mic size={20} className="md:size-[24px] text-white" />
                </button>
              ) : (
                <button
                  onClick={stopSession}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all active:scale-95"
                >
                  <MicOff size={20} className="md:size-[24px] text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Text Chat Input */}
          <form onSubmit={handleSendText} className="relative group">
            <div className="absolute inset-0 bg-violet-500/5 rounded-2xl blur-xl group-focus-within:bg-violet-500/10 transition-all pointer-events-none" />
            <div className="glass rounded-2xl p-1.5 md:p-2 flex items-center gap-2 border border-white/10 group-focus-within:border-violet-500/50 transition-all shadow-2xl relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText(e);
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent border-none outline-none px-3 md:px-4 py-2 text-sm text-white placeholder-gray-500 resize-none min-h-[40px] max-h-32"
                rows={1}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isTextThinking}
                className="p-2.5 md:p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl transition-all active:scale-90 text-white"
              >
                {isTextThinking ? (
                  <Loader2 size={16} className="md:size-[18px] animate-spin" />
                ) : (
                  <Send size={16} className="md:size-[18px]" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Drawer Toggle Button */}
      <button
        onClick={() => setIsLogOpen(true)}
        className={`absolute top-4 right-4 md:top-6 md:right-6 z-30 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-full p-3 text-gray-400 hover:text-white shadow-lg hover:bg-gray-700 transition-all hover:scale-105 ${isLogOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="View Activity Log"
      >
        <div className="relative">
          <MessageSquareText size={20} />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full border-2 border-gray-900"></span>
          )}
        </div>
      </button>

      {/* Backdrop overlay */}
      {isLogOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsLogOpen(false)}
        />
      )}

      {/* Sidebar Log Drawer */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] glass border-l border-white/10 flex flex-col z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isLogOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-2">
            <MessageSquareText size={18} className="text-violet-400" />
            <h3 className="text-base font-semibold text-white">Activity Log</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([])}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-gray-500 transition-colors"
              title="Clear Log"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setIsLogOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-hidden flex flex-col bg-gray-900/20">
          {/* Transcription Log */}
          <TranscriptionLog
            messages={messages}
            isThinking={isTextThinking || state === AssistantState.THINKING}
          />
        </div>
      </aside>
    </section>
  );
}

export default AssistantView;
