/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GenerateVideoParams, StorableParams } from '../types';

const HISTORY_KEY = 'adspark_studio_history';
const MAX_HISTORY_ITEMS = 5;

/**
 * Retrieves the generation history from localStorage.
 * @returns An array of past configurations.
 */
export const getHistory = (): StorableParams[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error reading history from localStorage', error);
    // On error, clear potentially corrupted data
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};

/**
 * Saves a new configuration to the history in localStorage.
 * @param params The generation parameters to save.
 */
export const saveConfiguration = (params: GenerateVideoParams) => {
  try {
    const history = getHistory();
    // Create a storable version of the params by removing non-serializable fields
    const { referenceImages, inputVideo, inputVideoObject, recordedAudioBlob, ...storableParams } = params;

    const newConfigString = JSON.stringify(storableParams);
    
    // Filter out the exact same configuration if it already exists to avoid duplicates
    const filteredHistory = history.filter(item => JSON.stringify(item) !== newConfigString);

    // Add the new configuration to the top of the list
    const newHistory = [storableParams, ...filteredHistory];
    
    // Trim the history to the maximum allowed number of items
    const trimmedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving history to localStorage', error);
  }
};
