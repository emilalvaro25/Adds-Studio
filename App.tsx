/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateScript, generateSpeech, generateVideo} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
  Resolution,
  VideoFile,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [voiceoverBuffer, setVoiceoverBuffer] = useState<AudioBuffer | null>(null);
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // A single state to hold the initial values for the prompt form
  const [initialFormValues, setInitialFormValues] =
    useState<Partial<GenerateVideoParams> | null>(null);

  // Check for API key on initial load
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        console.warn(
          'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
          error,
        );
        setShowApiKeyDialog(true);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null); // Reset for next fresh start

    try {
      // --- Stage 1: Initial Video Generation ---
      setLoadingTask('Generating initial ad scene...');
      const initialResult = await generateVideo(params);
      let finalResult = initialResult;

      // --- Stage 2: Automatic Extension (Optional) ---
      if (params.autoExtend) {
        setLoadingTask('Extending ad to full length...');
        const extendParams: GenerateVideoParams = {
          ...params,
          prompt: 'Continue the ad, showing the product in a new, exciting context.',
          inputVideoObject: initialResult.video,
          resolution: Resolution.P720, // Extension requires 720p
        };
        finalResult = await generateVideo(extendParams);
      }

      setVideoUrl(finalResult.objectUrl);
      setLastVideoBlob(finalResult.blob);
      setLastVideoObject(finalResult.video);

      // --- Stage 3: Voiceover Generation (Optional) ---
      let audioBuffer: AudioBuffer | null = null;
      if (params.voiceoverMode === 'tts' && params.voiceoverScript && params.voiceName) {
        setLoadingTask('Crafting AI voiceover...');
        audioBuffer = await generateSpeech(params.voiceoverScript, params.voiceName);
      } else if (params.voiceoverMode === 'record' && params.recordedAudioBlob) {
        setLoadingTask('Processing recorded audio...');
        // Convert recorded blob to AudioBuffer
        const arrayBuffer = await params.recordedAudioBlob.arrayBuffer();
        // FIX: Cast window to any to allow access to webkitAudioContext for broader browser support.
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      }
      setVoiceoverBuffer(audioBuffer);

      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      let userFriendlyMessage = `Video generation failed: ${errorMessage}`;
      let shouldOpenDialog = false;

      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Requested entity was not found.')) {
          userFriendlyMessage =
            'Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.';
          shouldOpenDialog = true;
        } else if (
          errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.includes('API key not valid') ||
          errorMessage.toLowerCase().includes('permission denied')
        ) {
          userFriendlyMessage =
            'Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.';
          shouldOpenDialog = true;
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);

      if (shouldOpenDialog) {
        setShowApiKeyDialog(true);
      }
    } finally {
      setLoadingTask(null);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    if (appState === AppState.ERROR && lastConfig) {
      handleRetry();
    }
  };

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setVoiceoverBuffer(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null); // Clear the form state
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      // Repopulate the form with the last configuration
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      // Fallback to a fresh start if there's no last config
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''}; // base64 not needed for preview

        setInitialFormValues({
          ...lastConfig,
          // Set up for extension
          prompt: 'Show the product being used in a new, exciting way.', // Auto-furnished prompt
          inputVideo: videoFile, // for preview in the form
          inputVideoObject: lastVideoObject, // for the API call
          resolution: Resolution.P720, // Extend requires 720p
          // Reset audio/extend options for the new step
          autoExtend: false,
          voiceoverMode: 'none',
          voiceoverScript: '',
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setVoiceoverBuffer(null);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatusError(`Failed to prepare video for extension: ${message}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}
      <header className="py-6 flex justify-center items-center px-8 relative z-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          AdSpark Studio
        </h1>
      </header>
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 overflow-y-auto">
        {appState === AppState.IDLE ? (
          <div className="flex-grow flex flex-col justify-center items-center">
            <div className="w-full text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-200">
                Create a Viral Video Ad in Seconds
              </h2>
              <p className="text-lg text-gray-400 mt-2">
                Describe your product, and our AI will generate a catchy,
                humorous ad for you.
              </p>
            </div>
            <div className="w-full">
              <PromptForm
                onGenerate={handleGenerate}
                generateScript={generateScript}
                initialValues={initialFormValues}
              />
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            {appState === AppState.LOADING && <LoadingIndicator task={loadingTask} />}
            {appState === AppState.SUCCESS && videoUrl && (
              <VideoResult
                videoUrl={videoUrl}
                voiceoverBuffer={voiceoverBuffer}
                onRetry={handleRetry}
                onNewVideo={handleNewVideo}
                onExtend={handleExtend}
                canExtend={lastConfig?.resolution === Resolution.P720 && !lastConfig?.autoExtend}
              />
            )}
            {appState === AppState.SUCCESS &&
              !videoUrl &&
              renderError(
                'Video generated, but URL is missing. Please try again.',
              )}
            {appState === AppState.ERROR &&
              errorMessage &&
              renderError(errorMessage)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
