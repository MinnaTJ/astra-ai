/**
 * Audio Utilities for Gemini Live API
 * Handles encoding/decoding of audio data for voice chat
 */

/**
 * Decodes a base64 string to a Uint8Array
 * @param {string} base64 - Base64 encoded string
 * @returns {Uint8Array} - Decoded byte array
 */
export function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array to a base64 string
 * @param {Uint8Array} bytes - Byte array to encode
 * @returns {string} - Base64 encoded string
 */
export function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes raw PCM audio bytes into an AudioBuffer for playback
 * @param {Uint8Array} data - Raw PCM audio data
 * @param {AudioContext} ctx - Web Audio API context
 * @param {number} sampleRate - Sample rate of the audio
 * @param {number} numChannels - Number of audio channels
 * @returns {Promise<AudioBuffer>} - Decoded audio buffer
 */
export async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Creates a blob object for PCM audio data suitable for Gemini Live API
 * @param {Float32Array} data - Float32 audio data from microphone
 * @returns {{ data: string, mimeType: string }} - Audio blob for API
 */
export function createAudioBlob(data) {
  const length = data.length;
  const int16 = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    // Clamping to avoid distortion
    const sample = Math.max(-1, Math.min(1, data[i]));
    int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000'
  };
}
