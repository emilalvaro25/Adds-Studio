/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Video } from '@google/genai';

// Defines the overall state of the application.
export enum AppState {
  IDLE,     // Waiting for user input
  LOADING,  // Processing a request
  SUCCESS,  // Request succeeded, showing result
  ERROR,    // An error occurred
}

// Supported video resolutions for generation.
export enum Resolution {
  P1080 = '1080p',
  P720 = '720p',
}

// Supported aspect ratios for generation.
export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

// Available AI voice names for TTS.
export enum VoiceName {
  KORE = 'Kore',
  PUCK = 'Puck',
  CHARON = 'Charon',
  FENRIR = 'Fenrir',
  ZEPHYR = 'Zephyr',
}

// Supported video generation models.
export enum VideoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO_HIGH = 'veo-3.1-generate-preview',
}

// Represents a file (image or video) with its metadata.
export interface FileWithBase64 {
  file: File;
  base64: string;
}

export type VideoFile = FileWithBase64;
export type ImageFile = FileWithBase64;

// All parameters required to generate a video.
export interface GenerateVideoParams {
  productName: string;
  productDescription: string;
  prompt: string;
  model: VideoModel;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  referenceImages?: ImageFile[];
  inputVideo?: VideoFile;
  inputVideoObject?: Video; // The object from a previous API response
  autoExtend: boolean;
  voiceoverMode: 'none' | 'tts' | 'record';
  voiceoverScript?: string;
  recordedAudioBlob?: Blob;
  voiceName?: VoiceName;
}

// Defines the structure for a preset ad configuration.
export interface Preset {
  title: string;
  description: string;
  prompt: string;
}
