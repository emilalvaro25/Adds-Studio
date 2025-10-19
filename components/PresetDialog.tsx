/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Preset } from '../types';

const presets: Preset[] = [
  {
    title: 'Humorous Unboxing',
    description: 'A funny, relatable take on opening a new product.',
    prompt: 'A humorous, fast-paced unboxing video. The person is overly excited and fumbles with the package. Close-ups on the product\'s best features, with funny on-screen text. Bright, energetic lighting.',
  },
  {
    title: 'Cinematic Product Showcase',
    description: 'A dramatic, high-quality look at your product.',
    prompt: 'A cinematic, slow-motion video showcasing the product on a rotating pedestal. Dramatic lighting with dark shadows. Epic, inspiring orchestral music. No people, just the product as the hero.',
  },
  {
    title: 'Viral TikTok Trend',
    description: 'Jump on a popular trend with your product.',
    prompt: 'A short video that mimics a popular TikTok dance or audio trend, but the product is seamlessly integrated as a main character. Use upbeat, trending audio style. Shot vertically.',
  },
  {
    title: 'Problem/Solution Demo',
    description: 'Show how your product solves a common problem.',
    prompt: 'A split-screen video. On the left, a person struggles with a common problem in black and white. On the right, a person uses the product to solve the problem effortlessly, in vibrant color. Satisfying and clear.',
  },
  {
    title: 'Aesthetic "Day in the Life"',
    description: 'Fit your product into a desirable lifestyle.',
    prompt: 'An aesthetic "day in the life" vlog-style video. The product is used naturally in beautiful, clean settings. Soft, natural lighting. Lo-fi, chill-hop background music. Focus on the feeling and lifestyle.',
  },
];

interface PresetDialogProps {
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

const PresetDialog: React.FC<PresetDialogProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl max-w-2xl w-full p-8 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-white mb-6">Choose a Style Preset</h2>
        <div className="w-full space-y-4">
          {presets.map((preset) => (
            <button
              key={preset.title}
              onClick={() => onSelect(preset.prompt)}
              className="w-full text-left p-4 bg-gray-900 hover:bg-indigo-900/50 border border-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <h3 className="font-semibold text-lg text-indigo-300">{preset.title}</h3>
              <p className="text-gray-400 text-sm">{preset.description}</p>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-8 px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PresetDialog;
