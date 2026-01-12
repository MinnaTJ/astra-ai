import { useEffect, useRef } from 'react';
import { AssistantState } from '@/constants';

/**
 * Audio waveform visualization component
 * @param {Object} props - Component props
 * @param {string} props.state - Current assistant state
 * @param {AnalyserNode} [props.analyser] - Web Audio analyser node
 */
function Waveform({ state, analyser }) {
  const canvasRef = useRef(null);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (
        analyser &&
        (state === AssistantState.LISTENING || state === AssistantState.SPEAKING)
      ) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Subtle idle pulse
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 10 + Math.sin(Date.now() / 200 + i) * 5;
        }
      }

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8;

        // Color shifts based on state
        let gradient;
        if (state === AssistantState.LISTENING) {
          gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#8b5cf6');
          gradient.addColorStop(1, '#d8b4fe');
        } else if (state === AssistantState.SPEAKING) {
          gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#93c5fd');
        } else {
          gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#4b5563');
          gradient.addColorStop(1, '#9ca3af');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, (height - barHeight) / 2, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth;
      }
    };

    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, analyser]);

  return (
    <div className="flex items-center justify-center w-full h-32 mt-8">
      <canvas ref={canvasRef} width={400} height={128} className="max-w-full" />
    </div>
  );
}

export default Waveform;
