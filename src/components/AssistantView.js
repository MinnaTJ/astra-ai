import React, { useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { AssistantState } from '@/constants';
import { sendTextMessage } from '@/services';
import { useVoiceSession } from '@/hooks';
import Waveform from './Waveform';
import TranscriptionLog from './TranscriptionLog';

/**
 * Main assistant interaction view with voice and text chat
 * @param {Object} props - Component props
 * @param {Object} props.settingsRef - Reference to current settings
 * @param {Object} props.jobActions - Job management action functions
 */
function AssistantView({ settingsRef, jobActions }) {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isTextThinking, setIsTextThinking] = useState(false);
  const [error, setError] = useState(null);

  const {
    saveJobApplication,
    deleteJobApplication,
    updateJobStatus,
    listJobs,
    findJobByCompany,
    onSyncGmail
  } = jobActions;

  // Handle tool calls from voice or text
  const handleToolCall = useCallback(
    (fc) => {
      let result = '';
      if (fc.name === 'save_job_application') {
        result = saveJobApplication(fc.args);
      } else if (fc.name === 'list_job_applications') {
        result = listJobs();
      } else if (fc.name === 'update_job_status') {
        result = updateJobStatus(fc.args.company, fc.args.status, fc.args.emailLink);
      } else if (fc.name === 'delete_job_application') {
        const job = findJobByCompany(fc.args.company);
        result = job
          ? deleteJobApplication(job.id)
          : `Could not find a job for ${fc.args.company}.`;
      } else if (fc.name === 'sync_gmail_emails') {
        onSyncGmail();
        result = "Syncing your Gmail for job updates...";
      }
      return result;
    },
    [saveJobApplication, deleteJobApplication, updateJobStatus, listJobs, findJobByCompany, onSyncGmail]
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
  }, []);

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
      const response = await sendTextMessage(userMsg, settingsRef.current);
      let assistantText = response.text || '';

      // Process function calls
      for (const part of response.functionCalls) {
        if (part.functionCall) {
          const result = handleToolCall(part.functionCall);
          if (!assistantText) {
            assistantText = result;
          } else {
            assistantText += `\n\n[Action: ${result}]`;
          }
        }
      }

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
      setError('Text service unavailable. Check your connection.');
    } finally {
      setIsTextThinking(false);
    }
  };

  const settings = settingsRef.current;

  return (
    <section className="flex-1 flex flex-col md:flex-row h-full overflow-hidden animate-in fade-in duration-300">
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

      {/* Sidebar Log */}
      <aside className="w-full md:w-96 glass border-l border-white/5 flex flex-col h-1/3 md:h-full">
        <div className="p-3 md:p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm md:text-base font-medium text-gray-300">Activity Log</h3>
          <button
            onClick={() => setMessages([])}
            className="p-1.5 hover:bg-white/5 rounded text-gray-500"
          >
            <X size={14} className="md:size-[16px]" />
          </button>
        </div>
        <div className="flex-1 p-3 md:p-4 overflow-hidden flex flex-col">
          <TranscriptionLog messages={messages} />
        </div>
      </aside>
    </section>
  );
}

export default AssistantView;
