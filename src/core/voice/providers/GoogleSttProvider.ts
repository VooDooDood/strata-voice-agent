/**
 * Google STT Provider
 * Uses expo-speech-recognition which wraps Android's native Google Speech Recognition
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { ISttProvider } from '../../types';

export class GoogleSttProvider implements ISttProvider {
  readonly name = 'Google (Native)';

  private transcript: string = '';
  private finalizedText: string = ''; // Accumulated finalized segments
  private resolveStop: ((transcript: string) => void) | null = null;
  private isListening: boolean = false;

  onPartialResult?: (text: string) => void;
  onError?: (error: Error) => void;

  async isAvailable(): Promise<boolean> {
    const result = await ExpoSpeechRecognitionModule.getStateAsync();
    return result !== null;
  }

  async startListening(): Promise<void> {
    // Request permissions if needed
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      throw new Error('Microphone permission not granted');
    }

    this.transcript = '';
    this.finalizedText = '';
    this.isListening = true;

    // Start recognition
    // continuous: true keeps listening until explicitly stopped
    // This prevents Android from auto-stopping on brief pauses
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
    });
  }

  async stopListening(): Promise<string> {
    // If not listening, return current transcript immediately
    if (!this.isListening) {
      return this.transcript;
    }

    return new Promise((resolve) => {
      this.resolveStop = resolve;
      this.isListening = false;

      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
        resolve(this.transcript);
        this.resolveStop = null;
        return;
      }

      // Fallback timeout in case no final result comes
      setTimeout(() => {
        if (this.resolveStop) {
          this.resolveStop(this.transcript);
          this.resolveStop = null;
        }
      }, 1000);
    });
  }

  // These methods should be called from a component using the hooks
  handleResult(transcript: string, isFinal: boolean) {
    if (isFinal) {
      // Accumulate finalized segments (add space between segments)
      if (this.finalizedText && transcript) {
        this.finalizedText = this.finalizedText + ' ' + transcript;
      } else {
        this.finalizedText = transcript;
      }
      this.transcript = this.finalizedText;

      // In continuous mode, isFinal just means this segment is done
      // We only resolve when explicitly stopped
      if (this.resolveStop) {
        this.isListening = false;
        this.resolveStop(this.finalizedText);
        this.resolveStop = null;
      }
    } else {
      // Show finalized text + current partial
      const displayText = this.finalizedText
        ? this.finalizedText + ' ' + transcript
        : transcript;
      this.transcript = displayText;

      if (this.onPartialResult) {
        this.onPartialResult(displayText);
      }
    }
  }

  handleError(error: Error) {
    this.isListening = false;
    if (this.onError) {
      this.onError(error);
    }
    if (this.resolveStop) {
      this.resolveStop(this.transcript);
      this.resolveStop = null;
    }
  }
}

// Singleton instance
export const googleSttProvider = new GoogleSttProvider();
