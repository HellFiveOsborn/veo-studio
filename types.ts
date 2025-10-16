/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';

export enum AppState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum VeoModel {
  VEO_3_1_FAST = 'veo-3.1-fast-generate-preview',
  VEO_3_1 = 'veo-3.1-generate-preview',
  VEO_3_0_FAST = 'veo-3.0-fast-generate-001',
  VEO_3_0 = 'veo-3.0-generate-001',
  VEO_2_0 = 'veo-2.0-generate-001',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Texto para Vídeo',
  FRAMES_TO_VIDEO = 'Frames para Vídeo',
  REFERENCES_TO_VIDEO = 'Referências para Vídeo',
  EXTEND_VIDEO = 'Estender Vídeo',
}

export enum CompressionQuality {
  OPTIMIZED = 'optimized',
  LOSSLESS = 'lossless',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface GenerateVideoParams {
  prompt: string;
  negativePrompt?: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame: ImageFile | null;
  endFrame: ImageFile | null;
  referenceImages: ImageFile[];
  styleImage: ImageFile | null;
  inputVideo: VideoFile | null;
  inputVideoObject: Video | null;
  inputImage: ImageFile | null;
  isLooping: boolean;
  durationSeconds?: number;
  allowPeople?: boolean;
  generateAudio?: boolean;
  enhancePrompt?: boolean;
  compressionQuality?: CompressionQuality;
}
