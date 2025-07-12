import { useParams } from 'react-router-dom';

export default function VibeIframeContainer() {
  const { vibeSlug } = useParams<{ vibeSlug: string }>();

  if (!vibeSlug) {
    return <div>No vibe slug provided</div>;
  }

  const iframeUrl = `https://${vibeSlug}.vibesdiy.app/`;

  return (
    <iframe
      src={iframeUrl}
      title={`Vibe: ${vibeSlug}`}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; hid; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; serial; usb; web-share; xr-spatial-tracking"
      allowFullScreen
    />
  );
}
