/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useEffect, useCallback} from 'react';
import {ArrowPathIcon, DownloadIcon, PlusIcon, SparklesIcon} from './icons';

interface VideoResultProps {
  videoUrl: string;
  voiceoverBuffer: AudioBuffer | null;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  voiceoverBuffer,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Function to play the audio buffer in sync with the video
  const playAudio = () => {
    if (!voiceoverBuffer || !videoRef.current) return;
    
    // Stop any existing audio
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
    
    // Initialize AudioContext on user interaction
    if (!audioContextRef.current) {
      // FIX: Cast window to any to allow access to webkitAudioContext for broader browser support.
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = voiceoverBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0, videoRef.current.currentTime); // Start from video's current time
    audioSourceRef.current = source;
  };

  // Function to stop the audio
  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
  };
  
  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `adspark-studio-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [videoUrl]);


  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !voiceoverBuffer) return;

    const handlePlay = () => playAudio();
    const handlePause = () => stopAudio();
    const handleEnded = () => stopAudio();
    const handleSeeked = () => {
        // If video is playing after seek, restart audio from new time
        if (!videoElement.paused) {
            playAudio();
        }
    }

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('seeked', handleSeeked);

    // Mute the video element itself so only our synced audio plays
    videoElement.muted = true;

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('seeked', handleSeeked);
      stopAudio(); // Cleanup on unmount
    };
  }, [videoUrl, voiceoverBuffer]);


  return (
    <div className="w-full flex flex-col items-center gap-8 p-8 bg-gray-800/50 rounded-lg border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-200">Your Ad is Ready!</h2>
      <div className="w-full max-w-2xl aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
        <video
          ref={videoRef}
          key={videoUrl} // Use key to force re-render on new video
          src={videoUrl}
          controls
          autoPlay
          loop
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
          <DownloadIcon className="w-5 h-5" />
          Download Video
        </button>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
          <ArrowPathIcon className="w-5 h-5" />
          Retry
        </button>
        {canExtend && (
          <button
            onClick={onExtend}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
            <SparklesIcon className="w-5 h-5" />
            Extend Ad (+7s)
          </button>
        )}
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
          <PlusIcon className="w-5 h-5" />
          Create New Ad
        </button>
      </div>
    </div>
  );
};

export default VideoResult;