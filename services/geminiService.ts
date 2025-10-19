/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Modality,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {GenerateVideoParams, VoiceName} from '../types';
import {decode, decodeAudioData} from '../utils';

// Create a single, reusable AudioContext for decoding TTS output.
// FIX: Cast window to any to allow access to webkitAudioContext for broader browser support.
const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});


export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  console.log('Starting video generation with params:', params);

  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const config: any = {
    numberOfVideos: 1,
    resolution: params.resolution,
  };

  // Aspect ratio is not used for extending videos.
  if (!params.inputVideoObject) {
    config.aspectRatio = params.aspectRatio;
  }

  const generateVideoPayload: any = {
    model: params.model,
    config: config,
  };

  if (params.prompt) {
    generateVideoPayload.prompt = params.prompt;
  }

  // Handle reference images (for initial ad creation with a product image)
  if (params.referenceImages && params.referenceImages.length > 0) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];
    for (const img of params.referenceImages) {
      console.log(`Adding reference image: ${img.file.name}`);
      referenceImagesPayload.push({
        image: {
          imageBytes: img.base64,
          mimeType: img.file.type,
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      });
    }
    generateVideoPayload.config.referenceImages = referenceImagesPayload;
  }

  // Handle video extension
  if (params.inputVideoObject) {
    generateVideoPayload.video = params.inputVideoObject;
    console.log(`Generating extension from input video object.`);
  }

  console.log('Submitting video generation request...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      throw new Error('No videos were generated.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }
    const videoObject = firstVideo.video;

    const url = decodeURIComponent(videoObject.uri);
    console.log('Fetching video from:', url);

    const res = await fetch(`${url}&key=${process.env.API_KEY}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }

    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);

    return {objectUrl, blob: videoBlob, uri: url, video: videoObject};
  } else {
    console.error('Operation failed:', operation);
    throw new Error('No videos generated.');
  }
};

/**
 * Generates speech from a script using a TTS model.
 * @param script The text to be converted to speech.
 * @param voiceName The AI voice to use.
 * @returns A promise that resolves with an AudioBuffer.
 */
export const generateSpeech = async (
  script: string,
  voiceName: VoiceName,
): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{parts: [{text: script}]}],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {voiceName: voiceName},
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error('Audio generation failed, no data received.');
  }

  const decodedAudio = decode(base64Audio);
  // Decode the raw PCM data into a usable AudioBuffer
  const audioBuffer = await decodeAudioData(decodedAudio, outputAudioContext, 24000, 1);
  return audioBuffer;
};

/**
 * Generates a short, catchy voiceover script for an ad.
 * @param productName The name of the product.
 * @param productDescription The description of the product.
 * @returns A promise that resolves with the generated script string.
 */
export const generateScript = async (
  productName: string,
  productDescription: string,
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Write a very short, punchy, and exciting 5-10 second voiceover script for a video ad.
  Product Name: "${productName}"
  Product Description: "${productDescription}"
  The script should be a single sentence or two very short sentences. Make it catchy and memorable.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text.trim();
};
