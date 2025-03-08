import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickSuggestions from '../app/components/QuickSuggestions';

describe('QuickSuggestions', () => {
  it('renders suggestions correctly', () => {
    const onSelectSuggestion = vi.fn();

    render(<QuickSuggestions onSelectSuggestion={onSelectSuggestion} />);

    expect(screen.getByText('Todo App')).toBeDefined();
    expect(screen.getByText('Pomodoro')).toBeDefined();
    expect(screen.getByText('Drawing App')).toBeDefined();
  });

  it('handles suggestion click', () => {
    const onSelectSuggestion = vi.fn();

    render(<QuickSuggestions onSelectSuggestion={onSelectSuggestion} />);

    const suggestionButton = screen.getByText('Todo App');
    fireEvent.click(suggestionButton);

    expect(onSelectSuggestion).toHaveBeenCalledWith(
      'Create a todo app with due dates and the ability to mark tasks as complete'
    );
  });
});
