/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Scripting your viral ad...",
  "Casting pixels for the leading role...",
  "Auditioning color palettes...",
  "Storyboarding the next big thing...",
  "Warming up the AI director...",
  "Optimizing for maximum engagement...",
  "This can take a few minutes, the results will be worth it!",
  "Adding a sprinkle of marketing magic...",
  "Finalizing the cut...",
  "Your ad is almost ready for its closeup!",
  "Teaching the AI about Gen-Z humor...",
  "Ensuring peak meme-ability...",
  "Calibrating the conversion-o-meter..."
];

interface LoadingIndicatorProps {
  task?: string | null;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ task }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="w-16 h-16 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
      <h2 className="text-2xl font-semibold mt-8 text-gray-200">Generating Your Ad</h2>
      <p className="mt-2 text-gray-400 text-center transition-opacity duration-500 h-6">
        {task || loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;
