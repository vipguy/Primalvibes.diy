import { useNavigate, useParams } from 'react-router-dom';
import SimpleAppLayout from '../components/SimpleAppLayout';
import VibesDIYLogo from '../components/VibesDIYLogo';
import { Basic } from '../components/vibespace/Basic';
import type { ReactElement } from 'react';
import { useFireproof } from 'use-fireproof';

// Define the structure of our vibe documents
interface VibeDocument {
  _id: string;
  title?: string;
  slug?: string;
  createdAt?: number;
  publishedUrl?: string;
  _attachments?: {
    screenshot?: {
      data: Blob;
    };
  };
}

export function meta() {
  return [
    { title: 'Space Vibes - Vibes DIY' },
    { name: 'description', content: 'User space in Vibes DIY' },
  ];
}

export default function SpaceRoute(): ReactElement {
  const navigate = useNavigate();
  const { prefixUserId } = useParams();

  // Check if the prefix is a tilde (~) and extract the userId
  // This handles our custom /~userId route pattern
  if (!prefixUserId || !prefixUserId.startsWith('~')) {
    // If this isn't a vibespace URL (doesn't start with ~), redirect to home
    navigate('/');
    return <div>Redirecting...</div>;
  }

  // Extract the actual userId after the tilde
  const userId = prefixUserId.substring(1);

  // Use Fireproof with the user-specific database
  const { useAllDocs } = useFireproof(`vu-${userId}`);

  // Query all documents in the database
  const allDocsResult = useAllDocs() as { docs: VibeDocument[] };
  const docs = allDocsResult.docs || [];
  const isLoading = !allDocsResult.docs; // If docs is undefined, it's still loading

  // Type the documents properly
  const vibes = docs.sort((b, a) => (a.createdAt || 0) - (b.createdAt || 0)) as VibeDocument[];

  // No need to log database contents

  // Handle clicking the remix button
  return (
    <SimpleAppLayout
      headerLeft={
        <div className="flex items-center">
          <a href="/" className="flex items-center px-2 py-1 hover:opacity-80" title="Home">
            <VibesDIYLogo width={100} className="pointer-events-none" />
          </a>
        </div>
      }
    >
      <Basic userId={userId} vibes={vibes} isLoading={isLoading} />
    </SimpleAppLayout>
  );
}
