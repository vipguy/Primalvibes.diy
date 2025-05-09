/**
 * Utilities for sharing and clipboard operations
 */

/**
 * Copy text to clipboard using the Clipboard API with fallback for older browsers
 */
export function copyToClipboard(text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Text copied to clipboard', text);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  } else {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Fallback: Could not copy text: ', err);
    }
  }
}
