interface QuickSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

function QuickSuggestions({ onSelectSuggestion }: QuickSuggestionsProps) {
  const suggestions = [
    {
      label: 'Todo App',
      text: 'Create a todo app with freeform textarea entry, that sends the text to AI to create todo list items using json.',
    },
    {
      label: 'Pomodoro',
      text: 'Create a pomodoro timer app with multiple timers work/break intervals and session tracking.',
    },
    {
      label: 'Drawing App',
      text: 'Create a simple drawing app with a canvas where users can draw with different colors and save their drawings.',
    },
    {
      label: 'Calculator',
      text: 'Create a calculator app with basic arithmetic operations.',
    },
    {
      label: 'Photo Gallery',
      text: 'Create a photo gallery app with a grid of images and a modal for each image.',
    },
    {
      label: 'Quiz App',
      text: "Write a trivia app that lets me pick a topic, and uses AI to make the next question while I'm answering the current one. It should make 3 at first. Ai should also judge the answer. It can either be right or wrong and funny.",
    },
    {
      label: 'Wildcard',
      text: "Generate a wildcard app, something I wouldn't expect.",
    },
    {
      label: 'Music',
      text: 'Make a fan app where I can type in a textarea of songs and artists and Ai will organize them into a playlist for me.',
    },
  ];

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectSuggestion(suggestion.text)}
            className="bg-light-background-00 dark:bg-dark-background-00 text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickSuggestions;
