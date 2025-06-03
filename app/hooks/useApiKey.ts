import { useState, useCallback, useRef } from 'react';
import { createOrUpdateKeyViaEdgeFunction } from '../services/apiKeyService';

/**
 * Hook for API key management that uses dynamic key provisioning
 * @param userId - Optional user ID for associating keys with specific users
 * @returns Object containing apiKey, error, refreshKey, and ensureApiKey states
 */
export function useApiKey(userId?: string) {
  const [apiKey, setApiKey] = useState<{ key: string; hash: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const loadingPromiseRef = useRef<Promise<{ key: string; hash: string }> | null>(null);
  // Always use a consistent storage key regardless of user ID
  const storageKey = 'vibes-openrouter-key';

  const checkLocalStorageForKey = useCallback(() => {
    const storedKey = localStorage.getItem(storageKey);
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey);
        // Make sure we have a valid key object
        if (keyData.key && typeof keyData.key === 'string' && keyData.hash) {
          return keyData; // Return the full stored object if valid
        }
        // If key is invalid, remove it
        localStorage.removeItem(storageKey);
      } catch (e) {
        localStorage.removeItem(storageKey); // Corrupted data
      }
    }
    return null;
  }, [storageKey]);

  // Internal function to fetch a new key
  const fetchNewKeyInternal = useCallback(
    async (currentKeyHashParam?: string): Promise<{ key: string; hash: string }> => {
      let keyData: any = null;

      try {
        let hashToUse = currentKeyHashParam;
        if (!hashToUse) {
          hashToUse = apiKey?.hash;
          if (!hashToUse) {
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
              try {
                const parsed = JSON.parse(storedData);
                hashToUse = parsed.hash;
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }

        const apiResponse = await createOrUpdateKeyViaEdgeFunction(userId, hashToUse);

        if (apiResponse && typeof apiResponse === 'object') {
          if (
            'key' in apiResponse &&
            typeof apiResponse.key === 'object' &&
            apiResponse.key !== null
          ) {
            // apiResponse is structured like { success: bool, key: { actual_data_object } }
            // The actual_data_object might or might not contain a 'key' string property.
            keyData = apiResponse.key;
          } else {
            // apiResponse itself is expected to be the actual_data_object
            // e.g., { key: "string"?, hash: "string", ... }
            keyData = apiResponse;
          }
        } else {
          // apiResponse is not a valid object, or null.
          // Set keyData to apiResponse to allow downstream error handling or logging of the invalid response.
          keyData = apiResponse; // keyData will be non-object here if apiResponse was, or null/undefined.
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Error fetching API key data');
        setError(err);
        throw err;
      }

      // Validate keyData and determine what to store and return
      if (keyData && typeof keyData.key === 'string' && keyData.key.trim() !== '') {
        // Case 1: Full key data received (key + hash + other metadata)
        const keyToStore = {
          ...keyData, // Contains key, hash, and other metadata from API
          createdAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(keyToStore));
        const resultingKey = { key: keyData.key, hash: keyData.hash };
        setApiKey(resultingKey);
        return resultingKey;
      } else if (keyData && typeof keyData.hash === 'string' && keyData.hash.trim() !== '') {
        // Case 2: Only hash (and other metadata) received, no new 'key' string
        // This is the "no-op success" for the key string itself, but hash/metadata might have updated.

        const existingKeyString = apiKey?.key; // Retrieve current key string from state

        const keyToStore = {
          ...keyData, // Contains new hash and other metadata from API
          key: existingKeyString, // Preserve existing key string, or undefined if none
          createdAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(keyToStore));

        const resultingKey = { key: existingKeyString || '', hash: keyData.hash };
        setApiKey(resultingKey); // Update state with new hash and preserved/empty key
        return resultingKey;
      } else {
        // Case 3: Invalid response (keyData is null, not an object, or missing both key and hash)
        console.error('Invalid API key response format (keyData problematic):', keyData);
        const err = new Error('Invalid API key response format');
        setError(err);
        throw err;
      }
    },
    [userId, apiKey, storageKey, setApiKey, setError]
  );

  const ensureApiKey = useCallback(async (): Promise<{ key: string; hash: string }> => {
    if (loadingPromiseRef.current) {
      return loadingPromiseRef.current;
    }

    if (apiKey?.key && apiKey?.hash) {
      return apiKey;
    }

    const storedKeyData = checkLocalStorageForKey();
    if (storedKeyData?.key && storedKeyData?.hash) {
      setApiKey({ key: storedKeyData.key, hash: storedKeyData.hash });
      return { key: storedKeyData.key, hash: storedKeyData.hash };
    }

    // setError(null); // Optionally clear previous errors

    const fetchPromise = fetchNewKeyInternal(storedKeyData?.hash)
      .then((newKey) => {
        loadingPromiseRef.current = null;
        return newKey;
      })
      .catch((err) => {
        loadingPromiseRef.current = null;
        // error state is already set by fetchNewKeyInternal
        throw err;
      });

    loadingPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [apiKey, checkLocalStorageForKey, fetchNewKeyInternal]);

  const refreshKey = useCallback(async (): Promise<{ key: string; hash: string }> => {
    // Attempt to refresh using the current key's hash if available.
    return await fetchNewKeyInternal(apiKey?.hash);
  }, [fetchNewKeyInternal, apiKey]);

  return { apiKey: apiKey?.key, apiKeyObject: apiKey, error, refreshKey, ensureApiKey };
}
