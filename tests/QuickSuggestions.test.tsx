import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickSuggestions from '../app/components/QuickSuggestions';

describe('QuickSuggestions', () => {
  it('renders suggestions correctly', () => {
    const onSelectSuggestion = vi.fn();

    render(<QuickSuggestions onSelectSuggestion={onSelectSuggestion} />);

    expect(screen.getByText('Todos')).toBeDefined();
    expect(screen.getByText('Pomodoro')).toBeDefined();
    expect(screen.getByText('Drawing')).toBeDefined();
  });

  it('handles suggestion click', () => {
    const onSelectSuggestion = vi.fn();

    render(<QuickSuggestions onSelectSuggestion={onSelectSuggestion} />);

    const suggestionButton = screen.getByText('Todos');
    fireEvent.click(suggestionButton);

    expect(onSelectSuggestion).toHaveBeenCalledWith(
      'Create a todo app with freeform textarea entry, that sends the text to AI to create todo list items using json, and tag them into the selected list.'
    );
  });
});
