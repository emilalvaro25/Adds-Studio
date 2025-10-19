/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { StorableParams, VideoModel } from '../types';

interface HistoryDialogProps {
  history: StorableParams[];
  onSelect: (params: StorableParams) => void;
  onClose: () => void;
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ history, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl max-w-2xl w-full p-8 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-white mb-6">Generation History</h2>
        <div className="w-full space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {history.length > 0 ? (
            history.map((item, index) => (
              <button
                key={index}
                onClick={() => onSelect(item)}
                className="w-full text-left p-4 bg-gray-900 hover:bg-indigo-900/50 border border-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <p className="font-semibold text-lg text-indigo-300 truncate" title={item.prompt}>
                  "{item.prompt || 'No Prompt'}"
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  <strong>Product:</strong> {item.productName || 'N/A'}
                </p>
                 <p className="text-gray-400 text-sm mt-1">
                  <strong>Settings:</strong> {item.model === VideoModel.VEO_HIGH ? "High Quality" : "Fast"}, {item.resolution}, {item.aspectRatio}
                </p>
              </button>
            ))
          ) : (
             <p className="text-gray-400 text-center py-8">No history yet. Generate an ad to see it here.</p>
          )}
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

export default HistoryDialog;
