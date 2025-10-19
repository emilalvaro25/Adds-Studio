/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState, useEffect} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  ImageFile,
  Resolution,
  StorableParams,
  VideoModel,
  VoiceName,
} from '../types';
import {
  BookOpenIcon,
  ClockIcon,
  SparklesIcon,
  TrashIcon,
  WandIcon,
} from './icons';
import AudioRecorder from './AudioRecorder';
import PresetDialog from './PresetDialog';
import HistoryDialog from './HistoryDialog';
import {getHistory} from '../services/historyService';

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const defaultParams: Omit<GenerateVideoParams, 'productName' | 'productDescription'> = {
  prompt: '',
  model: VideoModel.VEO_HIGH,
  resolution: Resolution.P720,
  aspectRatio: AspectRatio.PORTRAIT,
  autoExtend: false,
  voiceoverMode: 'none',
  voiceoverScript: '',
  voiceName: VoiceName.ZEPHYR,
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  generateScript: (
    productName: string,
    productDescription: string,
  ) => Promise<string>;
  initialValues?: Partial<GenerateVideoParams> | null;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  generateScript,
  initialValues,
}) => {
  const [params, setParams] = useState<GenerateVideoParams>({
    productName: '',
    productDescription: '',
    ...defaultParams,
  });
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageConstraintMessage, setImageConstraintMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (initialValues) {
      setParams((prev) => ({...prev, ...initialValues}));
      // If there's an initial video, it implies advanced settings were used.
      if (initialValues.inputVideo) {
        setShowAdvanced(true);
      }
    } else {
      // Reset to default when there are no initial values
      setParams({productName: '', productDescription: '', ...defaultParams});
    }
  }, [initialValues]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const {name, value} = e.target;
    setParams((prev) => ({...prev, [name]: value}));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, checked} = e.target;
    setParams((prev) => ({...prev, [name]: checked}));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      const newImage: ImageFile = {file, base64};
      // Enforce model constraints when an image is used
      setParams((prev) => ({
        ...prev,
        referenceImages: [newImage],
        model: VideoModel.VEO_HIGH,
        resolution: Resolution.P720,
        aspectRatio: AspectRatio.LANDSCAPE,
      }));
      setImageConstraintMessage(
        'Using an image requires the high-quality model and locks settings to 720p / 16:9.',
      );
    }
  };

  const handleRemoveImage = () => {
    setParams((prev) => ({
      ...prev,
      referenceImages: [],
      model: VideoModel.VEO_HIGH,
    }));
    setImageConstraintMessage(null);
  };

  const handleGenerateScript = async () => {
    if (!params.productName || !params.productDescription) {
      alert('Please enter a product name and description first.');
      return;
    }
    setIsGeneratingScript(true);
    try {
      const script = await generateScript(
        params.productName,
        params.productDescription,
      );
      setParams((prev) => ({...prev, voiceoverScript: script}));
    } catch (error) {
      console.error('Failed to generate script:', error);
      alert('Could not generate script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(params);
  };

  const handlePresetSelect = (prompt: string) => {
    setParams((prev) => ({...prev, prompt}));
    setShowPresets(false);
  };

  const handleHistorySelect = (selectedParams: StorableParams) => {
    setParams((prev) => ({...prev, ...selectedParams}));
    setShowHistory(false);
  };

  const isImageUsed =
    params.referenceImages && params.referenceImages.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-8 p-8 bg-gray-800/50 rounded-lg border border-gray-700">
      {showPresets && (
        <PresetDialog
          onSelect={handlePresetSelect}
          onClose={() => setShowPresets(false)}
        />
      )}
      {showHistory && (
        <HistoryDialog
          history={getHistory()}
          onSelect={handleHistorySelect}
          onClose={() => setShowHistory(false)}
        />
      )}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="productName"
            className="block text-sm font-medium text-gray-300 mb-1">
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={params.productName}
            onChange={handleInputChange}
            placeholder="e.g., Quantum Fizz"
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="productDescription"
            className="block text-sm font-medium text-gray-300 mb-1">
            Product Description
          </label>
          <textarea
            id="productDescription"
            name="productDescription"
            value={params.productDescription}
            onChange={handleInputChange}
            rows={2}
            placeholder="e.g., A self-stirring mug that runs on cosmic energy."
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-300 mb-1">
            Ad Scenario / Prompt
          </label>
          <div className="relative">
            <textarea
              id="prompt"
              name="prompt"
              value={params.prompt}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe the video you want to create. For example: A dramatic slow-motion shot of a cat knocking over a glass of water."
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 pr-44 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors">
                <ClockIcon className="w-4 h-4" />
                History
              </button>
              <button
                type="button"
                onClick={() => setShowPresets(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors">
                <BookOpenIcon className="w-4 h-4" />
                Presets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Extend Checkbox */}
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="autoExtend"
            name="autoExtend"
            type="checkbox"
            checked={params.autoExtend}
            onChange={handleCheckboxChange}
            disabled={!!params.inputVideoObject}
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 rounded bg-gray-800 disabled:opacity-50"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="autoExtend" className="font-medium text-gray-300">
            Auto-Extend Ad (+7s)
          </label>
          <p className="text-gray-400">
            Automatically generate a second scene to make the ad longer.
          </p>
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Product Image (Optional)
        </label>
        {params.referenceImages && params.referenceImages.length > 0 ? (
          <div className="flex items-center gap-4 p-2 bg-gray-900 border border-gray-700 rounded-md">
            <img
              src={URL.createObjectURL(params.referenceImages[0].file)}
              alt="Product Preview"
              className="w-16 h-16 object-cover rounded"
            />
            <span className="flex-grow text-gray-400 truncate">
              {params.referenceImages[0].file.name}
            </span>
            <button type="button" onClick={handleRemoveImage}>
              <TrashIcon className="w-6 h-6 text-red-400 hover:text-red-300" />
            </button>
          </div>
        ) : (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-500">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-gray-900 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        )}
        {imageConstraintMessage && (
          <p className="text-xs text-amber-400 mt-2">
            {imageConstraintMessage}
          </p>
        )}
      </div>

      {/* Advanced Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-6 p-4 border border-gray-700 rounded-md bg-gray-900/50">
          {/* Video Options */}
          <fieldset>
            <legend className="text-base font-medium text-gray-200">
              Video Options
            </legend>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {params.inputVideoObject ? (
                <p className="text-sm text-gray-400 col-span-3">
                  Extending existing video at 720p. Model and aspect ratio are locked.
                </p>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="resolution"
                      className="block text-sm font-medium text-gray-400">
                      Resolution
                    </label>
                    <select
                      id="resolution"
                      name="resolution"
                      value={params.resolution}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                      disabled={isImageUsed}>
                      <option value={Resolution.P720}>720p (Faster)</option>
                      <option value={Resolution.P1080}>
                        1080p (Higher Quality)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="aspectRatio"
                      className="block text-sm font-medium text-gray-400">
                      Aspect Ratio
                    </label>
                    <select
                      id="aspectRatio"
                      name="aspectRatio"
                      value={params.aspectRatio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                      disabled={isImageUsed}>
                      <option value={AspectRatio.PORTRAIT}>
                        9:16 (Portrait)
                      </option>
                      <option value={AspectRatio.LANDSCAPE}>
                        16:9 (Landscape)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="model"
                      className="block text-sm font-medium text-gray-400">
                      Model
                    </label>
                    <select
                      id="model"
                      name="model"
                      value={params.model}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                      disabled={isImageUsed}>
                      <option value={VideoModel.VEO_HIGH}>High Quality</option>
                      <option value={VideoModel.VEO_FAST}>Fast</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </fieldset>

          {/* Voiceover Options */}
          <fieldset>
            <legend className="text-base font-medium text-gray-200">
              Voiceover Options
            </legend>
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  id="vo-none"
                  name="voiceoverMode"
                  type="radio"
                  value="none"
                  checked={params.voiceoverMode === 'none'}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 bg-gray-800"
                />
                <label
                  htmlFor="vo-none"
                  className="ml-3 block text-sm font-medium text-gray-300">
                  No Voiceover
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="vo-tts"
                  name="voiceoverMode"
                  type="radio"
                  value="tts"
                  checked={params.voiceoverMode === 'tts'}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 bg-gray-800"
                />
                <label
                  htmlFor="vo-tts"
                  className="ml-3 block text-sm font-medium text-gray-300">
                  Generate AI Voiceover (TTS)
                </label>
              </div>
              {params.voiceoverMode === 'tts' && (
                <div className="pl-7 space-y-3">
                  <div className="relative">
                    <textarea
                      name="voiceoverScript"
                      value={params.voiceoverScript}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Enter voiceover script here..."
                      className="w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-28"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateScript}
                      disabled={isGeneratingScript}
                      className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors disabled:bg-gray-600">
                      {isGeneratingScript ? (
                        '...'
                      ) : (
                        <>
                          <WandIcon className="w-4 h-4" /> Generate
                        </>
                      )}
                    </button>
                  </div>
                  <select
                    name="voiceName"
                    value={params.voiceName}
                    onChange={handleInputChange}
                    className="block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {Object.values(VoiceName).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center">
                <input
                  id="vo-record"
                  name="voiceoverMode"
                  type="radio"
                  value="record"
                  checked={params.voiceoverMode === 'record'}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 bg-gray-800"
                />
                <label
                  htmlFor="vo-record"
                  className="ml-3 block text-sm font-medium text-gray-300">
                  Record Your Own Audio
                </label>
              </div>
              {params.voiceoverMode === 'record' && (
                <div className="pl-7">
                  <AudioRecorder
                    onRecordingComplete={(blob) =>
                      setParams((prev) => ({...prev, recordedAudioBlob: blob}))
                    }
                  />
                </div>
              )}
            </div>
          </fieldset>
        </div>
      )}

      {/* Submission Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-lg">
          <SparklesIcon className="w-6 h-6" />
          Generate Ad
        </button>
      </div>
    </form>
  );
};

export default PromptForm;
