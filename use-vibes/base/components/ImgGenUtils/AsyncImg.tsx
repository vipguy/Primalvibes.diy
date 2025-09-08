import * as React from 'react';
import { DocFileMeta } from 'use-fireproof';

interface AsyncImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  file: DocFileMeta;
}

/**
 * AsyncImg component that converts DocFileMeta to blob URL and displays image.
 * Simpler alternative to ImgFile that avoids blob cleanup issues.
 */
export function AsyncImg({ file, ...props }: AsyncImgProps) {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    // Convert DocFileMeta to File and create blob URL
    file.file().then((fileObj) => {
      if (!isMounted) return;
      
      // Only create blob URL for image files
      if (fileObj.type.startsWith('image/')) {
        objectUrl = URL.createObjectURL(fileObj);
        setSrc(objectUrl);
      }
    }).catch((error) => {
      console.error('[AsyncImg] Failed to load file:', error);
    });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  return src ? <img src={src} {...props} /> : null;
}