#!/bin/bash

# Detect macOS vs Linux sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED="sed -i ''"
else
  SED="sed -i"
fi

# Replace text-gray colors with theme colors
replace() {
  find ./app -type f \( -name "*.tsx" -o -name "*.jsx" \) \
    -exec $SED "s/$1/$2/g" {} +
}

# Light & dark mode text mappings
replace "text-gray-300" "text-dark-secondary"
replace "text-gray-400" "text-accent-01"
replace "text-gray-500" "text-accent-01"
replace "text-gray-600" "text-accent-02"
replace "text-gray-700" "text-light-secondary"
replace "text-gray-800" "text-light-primary"
replace "text-gray-900" "text-light-primary"

echo "✨ Replaced all text-gray classes with theme colors"
echo "✅ Text color replacements complete"
