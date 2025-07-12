import { useMemo } from 'react';
import PublishedVibeCard from './PublishedVibeCard';

// Featured vibes data
export const publishedVibes = [
  {
    name: 'Dr. Deas Drum Machine',
    url: 'https://excited-wombat-4753.vibecode.garden/',
  },
  {
    name: 'Dr. Deas Chord Synthesizer',
    url: 'https://environmental-newt-5799.vibecode.garden/',
  },
  {
    name: 'Bedtime Stories',
    url: 'https://okay-bedbug-2773.vibesdiy.app/',
  },
  {
    name: 'Chess Drills',
    url: 'https://advanced-tahr-2423.vibesdiy.app/',
  },
  {
    name: 'Napkin Sketch',
    url: 'https://varying-peacock-7591.vibesdiy.app/',
  },
  {
    name: 'Bonsai Generator',
    url: 'https://historical-wildfowl-2884.vibesdiy.app/',
  },
  {
    name: 'Reality Distortion Field',
    url: 'https://immense-shrimp-9469.vibesdiy.app/',
  },
  {
    name: 'Party Game',
    url: 'https://cute-frog-9259.vibesdiy.app',
  },
  {
    name: '303 Synth',
    url: 'https://nice-peacock-7883.vibesdiy.app/',
  },
  {
    name: 'Color Bender',
    url: 'https://loose-gerbil-5537.vibesdiy.app/',
  },
  {
    name: 'Startup Landing',
    url: 'https://dominant-lion-3190.vibesdiy.app/',
  },
  {
    name: 'Archive Radio',
    url: 'https://minimum-sawfish-6762.vibesdiy.app',
  },
  {
    name: 'BMX Legends',
    url: 'https://interested-barnacle-9449.vibesdiy.app',
  },
  {
    name: 'Vibecode News',
    url: 'https://smiling-barnacle-8368.vibesdiy.app/',
  },
  {
    name: 'Museum API',
    url: 'https://global-kingfisher-4005.vibesdiy.app',
  },
  {
    name: 'Ascii Camera',
    url: 'https://physical-krill-5417.vibesdiy.app',
  },
  {
    name: 'Moto Tempest',
    url: 'https://proper-lemur-3368.vibesdiy.app/',
  },
  {
    name: 'Cosmic Canvas',
    url: 'https://grand-platypus-4140.vibesdiy.app',
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
