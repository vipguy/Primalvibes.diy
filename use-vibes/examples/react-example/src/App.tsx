import { useState, useRef, useEffect } from 'react';
import { ImgGen, useFireproof } from 'use-vibes';
import './App.css';

const APP_DBNAME = 'ImgGen2';

function App() {
  const [inputPrompt, setInputPrompt] = useState('');
  const [activePrompt, setActivePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>();
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'auto'>('low');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Fireproof to query all images
  const { useLiveQuery, database } = useFireproof(APP_DBNAME);

  // State for testing direct AI response display (bypassing database)
  const [directAiImage, setDirectAiImage] = useState<string | null>(null);
  const [directImageInfo, setDirectImageInfo] = useState<string>('');
  const [interceptNextGeneration, setInterceptNextGeneration] = useState(false);

  // Simple approach: Set up a global interceptor on window object
  useEffect(() => {
    if (interceptNextGeneration) {
      // Create a global function that the use-image-gen hook can call
      (window as any).interceptAiResponse = (base64Data: string, responseInfo: any) => {
        console.log('[Direct AI Test] 🎯 Intercepted AI response data!', {
          base64Length: base64Data.length,
          responseInfo,
        });

        setDirectAiImage(base64Data);
        setDirectImageInfo(`Intercepted AI Response - Length: ${base64Data.length} characters`);
        setInterceptNextGeneration(false); // Reset the flag

        // Clean up the global interceptor
        delete (window as any).interceptAiResponse;
      };

      console.log('[Direct AI Test] 🎯 Global interceptor ready');

      // Cleanup
      return () => {
        if ((window as any).interceptAiResponse) {
          delete (window as any).interceptAiResponse;
        }
      };
    }
  }, [interceptNextGeneration]);

  // Round-trip test for file storage on page load
  useEffect(() => {
    const testFileRoundTrip = async () => {
      try {
        console.log('[File Test] Starting round-trip test...');

        // Create a simple text file
        const testData = 'Hello, this is a test file from ' + new Date().toISOString();
        const testFile = new File([testData], 'test.txt', { type: 'text/plain' });

        console.log('[File Test] Created test file:', {
          name: testFile.name,
          size: testFile.size,
          type: testFile.type,
          lastModified: testFile.lastModified,
        });

        // Save it to Fireproof
        const testDoc = {
          type: 'file-test',
          created: Date.now(),
          _files: {
            testFile: testFile,
          },
        };

        const saveResult = await database.put(testDoc);
        console.log('[File Test] Saved to Fireproof:', saveResult);

        // Immediately read it back
        const retrievedDoc = await database.get(saveResult.id);
        console.log('[File Test] Retrieved document:', {
          id: retrievedDoc._id,
          type: retrievedDoc.type,
          hasFiles: !!retrievedDoc._files,
          fileKeys: Object.keys(retrievedDoc._files || {}),
        });

        // Check the file object that came back
        const retrievedFileObj = retrievedDoc._files?.testFile;
        console.log('[File Test] Retrieved file object:', {
          type: typeof retrievedFileObj,
          properties: Object.keys(retrievedFileObj || {}),
          hasFileMethod: typeof retrievedFileObj?.file === 'function',
          fileType: retrievedFileObj?.type,
          fileSize: retrievedFileObj?.size,
        });

        // Try to get the actual file content
        if (retrievedFileObj && typeof retrievedFileObj.file === 'function') {
          const actualFile = await retrievedFileObj.file();
          console.log(
            '[File Test] Actual file from .file():',
            {
              type: typeof actualFile,
              isFile: actualFile instanceof File,
            },
            actualFile
          );

          // Try to read the content
          const text = await actualFile.text();
          console.log('[File Test] File content:', text);

          // Test creating blob URL
          const blobUrl = URL.createObjectURL(actualFile);
          console.log('[File Test] Created blob URL:', blobUrl);

          // Test if blob URL is accessible
          try {
            const response = await fetch(blobUrl);
            const fetchedText = await response.text();
            console.log('[File Test] Fetched from blob URL:', fetchedText);
            URL.revokeObjectURL(blobUrl);
          } catch (fetchError) {
            console.error('[File Test] Failed to fetch from blob URL:', fetchError);
          }
        }
      } catch (error) {
        console.error('[File Test] Round-trip test failed:', error);
      }
    };

    // Run test after a short delay to let everything initialize
    const timer = setTimeout(testFileRoundTrip, 1000);
    return () => clearTimeout(timer);
  }, [database]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPrompt(e.target.value);
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const qualityMap: Record<number, 'low' | 'medium' | 'high' | 'auto'> = {
      0: 'low',
      1: 'medium',
      2: 'high',
      3: 'auto',
    };
    setQuality(qualityMap[value]);
  };

  const handleGenerate = (e?: React.FormEvent) => {
    // Prevent default form submission if event exists
    if (e) e.preventDefault();

    if (!inputPrompt.trim()) return;
    // Set the active prompt that gets passed to ImgGen only when button is clicked
    setActivePrompt(inputPrompt.trim());
    setSelectedImageId(undefined);
    setIsGenerating(true);
  };

  const handleImageLoad = () => {
    setIsGenerating(false);
  };

  const handleImageError = (error: Error) => {
    console.error('Image generation failed:', error);
    setIsGenerating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);

      // Create preview URL for the uploaded image
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get all documents with type: 'image'
  const { docs: imageDocuments } = useLiveQuery('type', {
    key: 'image',
    descending: true,
  });

  // Debug logging to track query results
  useEffect(() => {
    console.log('[App Debug] Image documents from useLiveQuery:', {
      count: imageDocuments.length,
      documents: imageDocuments.map((doc) => ({
        id: doc._id,
        type: doc.type,
        hasFiles: !!doc._files,
        fileKeys: Object.keys(doc._files || {}),
        prompt: doc.prompt,
      })),
    });
  }, [imageDocuments]);

  return (
    <div className="container">
      <h1>Simple Image Generator</h1>
      <form onSubmit={handleGenerate} className="input-container">
        <input
          type="text"
          value={inputPrompt}
          onChange={handleInputChange}
          placeholder="Enter your image prompt here..."
          className="prompt-input"
        />
        <div className="quality-slider-container">
          <div className="slider-header">
            <label>
              Quality: <span className="quality-value">{quality}</span>
            </label>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={['low', 'medium', 'high', 'auto'].indexOf(quality)}
            onChange={handleQualityChange}
            className="quality-slider"
            style={{ width: '100%' }}
          />
          <div
            className="quality-labels"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: '8px',
            }}
          >
            <span className={quality === 'low' ? 'active' : ''} style={{ textAlign: 'center' }}>
              Low
            </span>
            <span className={quality === 'medium' ? 'active' : ''} style={{ textAlign: 'center' }}>
              Medium
            </span>
            <span className={quality === 'high' ? 'active' : ''} style={{ textAlign: 'center' }}>
              High
            </span>
            <span className={quality === 'auto' ? 'active' : ''} style={{ textAlign: 'center' }}>
              Auto
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="generate-button"
          disabled={isGenerating || !inputPrompt.trim()}
        >
          {isGenerating ? 'Generating...' : uploadedImage ? 'Edit Image' : 'Generate Image'}
        </button>
      </form>

      <div className="image-upload-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <h3>Upload an image to edit</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            style={{ flexGrow: 1 }}
          />
          {uploadedImage && (
            <button
              onClick={handleClearImage}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
        {imagePreview && (
          <div style={{ marginTop: '10px', maxWidth: '300px' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: '100%', borderRadius: '8px', border: '2px solid #ddd' }}
            />
          </div>
        )}
      </div>

      <div className="img-wrapper">
        <ImgGen
          prompt={activePrompt}
          _id={selectedImageId}
          images={uploadedImage ? [uploadedImage] : undefined}
          database={APP_DBNAME}
          options={{
            debug: true,
            quality,
            imgUrl: 'https://vibecode.garden',
            size: '1024x1024',
          }}
          onComplete={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Display previously generated images */}
      {imageDocuments.length > 0 && (
        <div className="history">
          <h3>Previously Generated Images</h3>
          <div className="image-grid">
            {imageDocuments.map((doc) => (
              <div key={doc._id} className="image-item">
                <div className="thumbnail-container">
                  <ImgGen
                    _id={doc._id}
                    className="thumbnail-img"
                    database={APP_DBNAME}
                    debug={true}
                    options={{
                      quality: quality,
                      imgUrl: 'https://vibecode.garden',
                      size: '1024x1024',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct AI Response Test Display */}
      {directAiImage && (
        <div
          style={{
            marginTop: '20px',
            border: '3px solid #4CAF50',
            padding: '15px',
            backgroundColor: '#f9fff9',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>
            ✅ Direct AI Response Test (Bypassing Database)
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{directImageInfo}</p>
          <img
            src={`data:image/png;base64,${directAiImage}`}
            alt="Direct AI Response Image"
            style={{
              maxWidth: '400px',
              border: '2px solid #4CAF50',
              borderRadius: '4px',
              display: 'block',
              marginTop: '10px',
            }}
            onLoad={() => console.log('[Direct AI Test] ✅ Image loaded successfully!')}
            onError={(e) => console.error('[Direct AI Test] ❌ Image failed to load:', e)}
          />
          <button
            onClick={() => {
              setDirectAiImage(null);
              setDirectImageInfo('');
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Test Image
          </button>
        </div>
      )}

      {/* Test Control Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => {
            setInterceptNextGeneration(true);
            console.log(
              '[Direct AI Test] 🎯 Next generation will be intercepted for direct display'
            );
          }}
          disabled={interceptNextGeneration}
          style={{
            padding: '12px 24px',
            backgroundColor: interceptNextGeneration ? '#ccc' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: interceptNextGeneration ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {interceptNextGeneration
            ? '🎯 Ready to Intercept Next Generation'
            : '🧪 Enable Direct AI Response Test'}
        </button>
      </div>
    </div>
  );
}

export default App;
