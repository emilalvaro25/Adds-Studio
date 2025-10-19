/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState, useRef, useCallback} from 'react';
import {MicIcon, StopCircleIcon} from './icons';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioURL(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          onRecordingComplete(audioBlob);
          // Stop all media tracks to turn off the mic indicator
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError(
          'Microphone access denied. Please allow microphone permissions in your browser settings.',
        );
      }
    } else {
      setError('Audio recording is not supported by your browser.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
            <MicIcon className="w-5 h-5" />
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
            <StopCircleIcon className="w-5 h-5" />
            <span>Stop Recording</span>
          </button>
        )}
        {audioURL && (
          <audio src={audioURL} controls className="h-10" />
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default AudioRecorder;
