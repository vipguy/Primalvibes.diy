import { useMemo } from 'react';
import PublishedVibeCard from './PublishedVibeCard';

// Featured vibes data
export const publishedVibes = [
  {
    name: 'Bedtime Stories',
    url: 'https://okay-bedbug-2773.vibecode.garden/',
  },
  {
    name: 'Chess Drills',
    url: 'https://advanced-tahr-2423.vibecode.garden/',
  },
  {
    name: 'Napkin Sketch',
    url: 'https://varying-peacock-7591.vibecode.garden/',
  },
  {
    name: 'Reality Distortion Field',
    url: 'https://immense-shrimp-9469.vibecode.garden/',
  },
  {
    name: 'Party Game',
    url: 'https://cute-frog-9259.vibecode.garden',
  },
  {
    name: '303 Synth',
    url: 'https://nice-peacock-7883.vibecode.garden/',
  },
  {
    name: 'Color Bender',
    url: 'https://loose-gerbil-5537.vibecode.garden/',
  },
  {
    name: 'Startup Landing',
    url: 'https://dominant-lion-3190.vibecode.garden/',
  },
  {
    name: 'Archive Radio',
    url: 'https://minimum-sawfish-6762.vibecode.garden',
  },
  {
    name: 'BMX Legends',
    url: 'https://interested-barnacle-9449.vibecode.garden',
  },
  {
    name: 'Vibecode News',
    url: 'https://smiling-barnacle-8368.vibecode.garden/',
  },
  {
    name: 'Museum API',
    url: 'https://global-kingfisher-4005.vibecode.garden',
  },
  {
    name: 'Ascii Camera',
    url: 'https://physical-krill-5417.vibecode.garden',
  },
  {
    name: 'Moto Tempest',
    url: 'https://proper-lemur-3368.vibecode.garden/',
  },
  {
    name: 'Cosmic Canvas',
    url: 'https://grand-platypus-4140.vibecode.garden',
  },
  {
    name: 'Bonsai Generator',
    url: 'https://lonely-flamingo-6403.vibecode.garden/',
  },
];

interface FeaturedVibesProps {
  count?: number;
  className?: string;
}

export default function FeaturedVibes({ count = 3, className = '' }: FeaturedVibesProps) {
  const filteredVibes = useMemo(() => {
    // Get random vibes from the publishedVibes array
    const shuffled = [...publishedVibes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, [count]);

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-3 gap-4">
        {filteredVibes.map((vibe) => (
          <PublishedVibeCard key={vibe.name} publishedUrl={vibe.url} name={vibe.name} />
        ))}
      </div>
    </div>
  );
}
