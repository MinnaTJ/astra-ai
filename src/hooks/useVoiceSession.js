import { useState, useRef, useCallback, useEffect } from 'react';
import { AssistantState, AUDIO_CONFIG } from '@/constants';
import { decode, decodeAudioData, createAudioBlob, createVoiceSession } from '@/services';

/**
 * Custom hook for managing voice chat session with Gemini
 * @param {Object} options - Hook configuration
 * @returns {Object} - Voice session state and controls
 */
export function useVoiceSession(options) {
  const { settingsRef, onMessage, onToolCall, onError } = options;

  const [state, setState] = useState(AssistantState.IDLE);

  // Audio refs
  const inputAudioCtxRef = useRef(null);
  const outputAudioCtxRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const analyserRef = useRef(null);
  const sourcesRef = useRef(new Set());
  const nextStartTimeRef = useRef(0);

  // Session ref
  const sessionRef = useRef(null);
  const streamRef = useRef(null);

  // Transcription tracking
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const startSession = useCallback(async () => {
    // Guard against multiple sessions
    if (state !== AssistantState.IDLE && state !== AssistantState.ERROR) {
      return;
    }

    try {
      setState(AssistantState.CONNECTING);
      nextStartTimeRef.current = 0;

      // Initialize audio contexts
      if (!inputAudioCtxRef.current) {
        inputAudioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({ sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE });
      }
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({ sampleRate: AUDIO_CONFIG.OUTPUT_SAMPLE_RATE });
      }

      const inputCtx = inputAudioCtxRef.current;
      const outputCtx = outputAudioCtxRef.current;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      // Create analyser for waveform visualization
      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
      analyserRef.current = analyser;

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create voice session
      const sessionPromise = createVoiceSession({
        settings: settingsRef.current,
        callbacks: {
          onopen: () => {
            setState(AssistantState.LISTENING);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(
              AUDIO_CONFIG.BUFFER_SIZE,
              1,
              1
            );
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              sessionPromise.then((session) => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            // Handle tool calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = onToolCall(fc);
                if (result) {
                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result }
                      }
                    });
                  });
                }
              }
            }

            // Handle transcriptions
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current +=
                message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current +=
                message.serverContent.inputTranscription.text;
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscription.current.trim();
              const assistantText = currentOutputTranscription.current.trim();
              if (userText || assistantText) {
                onMessage(userText, assistantText);
              }
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            // Handle audio output
            const base64EncodedAudioString =
              message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              setState(AssistantState.SPEAKING);
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime
              );

              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputCtx,
                AUDIO_CONFIG.OUTPUT_SAMPLE_RATE,
                1
              );
              const audioSource = outputCtx.createBufferSource();
              audioSource.buffer = audioBuffer;
              audioSource.connect(analyser);
              analyser.connect(outputCtx.destination);

              audioSource.addEventListener('ended', () => {
                sourcesRef.current.delete(audioSource);
                if (sourcesRef.current.size === 0) {
                  setState(AssistantState.LISTENING);
                }
              });

              audioSource.start(nextStartTimeRef.current);
              nextStartTimeRef.current =
                nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(audioSource);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              stopAllAudio();
              setState(AssistantState.LISTENING);
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            onError('Connection interrupted. Please refresh or check your API key.');
            setState(AssistantState.ERROR);
          },
          onclose: () => {
            if (state !== AssistantState.ERROR) {
              setState(AssistantState.IDLE);
            }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      onError(err.message || 'Microphone access denied or session failed to start.');
      setState(AssistantState.ERROR);
    }
  }, [settingsRef, onMessage, onToolCall, onError, stopAllAudio, state]);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    stopAllAudio();
    setState(AssistantState.IDLE);
  }, [stopAllAudio]);

  // Handle cleanup on unmount for the hook itself
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    state,
    setState,
    analyser: analyserRef.current,
    startSession,
    stopSession
  };
}
