import { fetchVibeMetadata, generateMetaHTML } from './utils/meta-utils.ts';

// Import the hardcoded firehose slug
// Note: This import path works for edge functions accessing app config
const FIREHOSE_SLUG = 'silent-zeus-5946';

export default async (request: Request) => {
  const url = new URL(request.url);
  let vibeSlug: string;

  // Check if this is a /vibe/* route
  const vibeMatch = url.pathname.match(/^\/vibe\/([^\/]+)$/);
  if (vibeMatch) {
    vibeSlug = vibeMatch[1];
  } else if (url.pathname === '/firehose') {
    vibeSlug = FIREHOSE_SLUG;
  } else {
    return; // Let other handlers deal with it
  }

  try {
    const metadata = await fetchVibeMetadata(vibeSlug);
    
    // Override canonical URL for firehose route
    if (url.pathname === '/firehose') {
      metadata.canonicalUrl = 'https://vibes.diy/firehose';
    }
    
    const html = generateMetaHTML(metadata);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching vibe metadata:', error);
    return; // Fall back to normal routing
  }
};

export const config = {
  path: ['/vibe/*', '/firehose'],
};
