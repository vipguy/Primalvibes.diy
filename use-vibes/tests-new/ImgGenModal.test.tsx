import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ImageDocument, ImgGenModal, base64ToFile } from 'use-vibes';
import { fireproof } from 'use-fireproof';

// // Mock ImgFile component
// vi.mock('use-fireproof', () => ({
//   ImgFile: ({ alt }: { alt: string; file: unknown; className?: string }) => (
//     <img data-testid="mock-img-file" alt={alt} />
//   ),
// }));

// // Mock createPortal to render content directly without portal
// vi.mock('react-dom', async () => {
//   const actual = await vi.importActual('react-dom');
//   return {
//     ...(actual as Record<string, unknown>),
//     createPortal: (children: React.ReactNode) => children,
//   };
// });

describe('ImgGenModal Component', () => {
  const mockFile = new File(['dummy content'], 'dummy.png', { type: 'image/png' });
  const database = fireproof('gen-modal', {
    storeUrls: {
      base: 'memory://gen-modal',
    },
  });
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentFile: mockFile,
    alt: 'Test image',
    promptText: 'Test prompt',
    editedPrompt: null,
    setEditedPrompt: vi.fn(),
    handlePromptEdit: vi.fn(),
    // toggleDeleteConfirm is no longer used
    isDeleteConfirmOpen: false,
    handleDeleteConfirm: vi.fn(),
    handleCancelDelete: vi.fn(),
    handlePrevVersion: vi.fn(),
    handleNextVersion: vi.fn(),
    handleRegen: vi.fn(),
    versionIndex: 0,
    totalVersions: 3,
    progress: 100,
    database,
  };

  beforeAll(async () => {
    const imgDoc: ImageDocument = {
      _id: '', // Will be assigned by Fireproof
      type: 'image',
      created: Date.now(),
      currentVersion: 0, // 0-based indexing for versions array
      versions: [
        {
          id: 'v1',
          created: Date.now(),
          promptKey: 'p1',
        },
      ],
      prompts: {
        p1: {
          text: 'internal creation',
          created: Date.now(),
        },
      },
      currentPromptKey: 'p1',
      _files: {
        v1: base64ToFile(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'mock-img-file'
        ),
      },
    };
    await database.put(imgDoc);
  });

  beforeEach(() => {
    // vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<ImgGenModal {...mockProps} />);

    // Check that modal is rendered
    expect(screen.getByRole('presentation')).toBeInTheDocument();
    expect(screen.getByTestId('mock-img-file')).toBeInTheDocument();
    expect(screen.getByTestId('mock-img-file')).toHaveAttribute('alt', 'Test image');
  });

  it('should not render modal when isOpen is false', () => {
    const { container } = render(<ImgGenModal {...mockProps} isOpen={false} />);

    // Check that modal is not rendered
    expect(container).toBeEmptyDOMElement();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<ImgGenModal {...mockProps} />);

    // Click backdrop (container with presentation role)
    fireEvent.click(screen.getByRole('presentation'));

    // Check that onClose was called
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when figure is clicked (event should not propagate)', () => {
    render(<ImgGenModal {...mockProps} />);

    // Click figure (wrapper that contains image and controls)
    fireEvent.click(screen.getByRole('figure'));

    // Check that onClose was not called
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('should include ImageOverlay with correct props', () => {
    render(<ImgGenModal {...mockProps} />);

    // Check that prompt text is rendered (confirms ImageOverlay is included)
    expect(screen.getByText('Test prompt')).toBeInTheDocument();

    // We can also verify that controls are present
    expect(screen.getByLabelText('Regenerate image')).toBeInTheDocument();

    // Verify version navigation is present
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should call handleNextVersion when next button is clicked', () => {
    render(<ImgGenModal {...mockProps} />);

    // Click next version button
    fireEvent.click(screen.getByLabelText('Next version'));

    // Check that handleNextVersion was called
    expect(mockProps.handleNextVersion).toHaveBeenCalledTimes(1);
  });

  it('should call handlePrevVersion when previous button is clicked', () => {
    render(<ImgGenModal {...mockProps} versionIndex={1} />);

    // Click previous version button
    fireEvent.click(screen.getByLabelText('Previous version'));

    // Check that handlePrevVersion was called
    expect(mockProps.handlePrevVersion).toHaveBeenCalledTimes(1);
  });

  it('should call handleDeleteConfirm when delete button is clicked twice', () => {
    render(<ImgGenModal {...mockProps} />);

    // First click shows confirmation
    fireEvent.click(screen.getByLabelText('Delete image'));

    // We should see the confirmation button after first click
    expect(screen.getByLabelText('Confirm delete')).toBeInTheDocument();
    expect(screen.getByText('Delete image?')).toBeInTheDocument();

    // Click the confirm delete button
    fireEvent.click(screen.getByLabelText('Confirm delete'));

    // Check that handleDeleteConfirm was called
    expect(mockProps.handleDeleteConfirm).toHaveBeenCalled();
  });
});
