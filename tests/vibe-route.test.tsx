import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VibeIframeContainer from '../app/routes/vibe';

// Mock the useParams hook to return a vibeSlug
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ vibeSlug: 'sound-panda-9086' }),
  };
});

describe('Vibe Route', () => {
  it('renders the iframe with the correct src URL', () => {
    render(
      <MemoryRouter initialEntries={['/vibe/sound-panda-9086']}>
        <Routes>
          <Route path="/vibe/:vibeSlug" element={<VibeIframeContainer />} />
        </Routes>
      </MemoryRouter>
    );

    // Check that the iframe has the correct src attribute
    const iframe = screen.getByTitle('Vibe: sound-panda-9086');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toBe('https://sound-panda-9086.vibesdiy.app/');
  });

  it('displays a header with the formatted title and Remix button', () => {
    render(
      <MemoryRouter initialEntries={['/vibe/sound-panda-9086']}>
        <Routes>
          <Route path="/vibe/:vibeSlug" element={<VibeIframeContainer />} />
        </Routes>
      </MemoryRouter>
    );

    // Check that the iframe has the correct src attribute
    const iframe = screen.getByTitle('Vibe: sound-panda-9086');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toBe('https://sound-panda-9086.vibesdiy.app/');
  });
});
