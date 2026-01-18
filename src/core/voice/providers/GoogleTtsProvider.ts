/**
 * Google TTS Provider
 * Uses expo-speech which wraps Android's native Text-to-Speech
 */

import * as Speech from 'expo-speech';
import { ITtsProvider, Voice } from '../../types';

export class GoogleTtsProvider implements ITtsProvider {
  readonly name = 'Google (Native)';
  
  private currentVoiceId: string = '';

  async isAvailable(): Promise<boolean> {
    // expo-speech is always available on Android/iOS
    return true;
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: Speech.SpeechOptions = {
        language: 'en-US',
        onDone: () => resolve(),
        onError: (error) => reject(new Error(String(error))),
      };
      
      if (this.currentVoiceId) {
        options.voice = this.currentVoiceId;
      }
      
      Speech.speak(text, options);
    });
  }

  stop(): void {
    Speech.stop();
  }

  async getVoices(): Promise<Voice[]> {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.map((v) => ({
      id: v.identifier,
      name: v.name,
      language: v.language,
    }));
  }

  setVoice(voiceId: string): void {
    this.currentVoiceId = voiceId;
  }
}

// Singleton instance
export const googleTtsProvider = new GoogleTtsProvider();
