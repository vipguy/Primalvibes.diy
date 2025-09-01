#!/bin/bash

# Cross-platform sed (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED="sed -i ''"
else
  SED="sed -i"
fi

echo "🌑 Applying Neumorphic Dark Mode Theme..."

# Map rainbow/brutalist colors → your neumorphic tokens
declare -A replacements=(
  # Blue shades
  ["bg-blue-500"]="bg-accent-02"
  ["bg-blue-600"]="bg-accent-03"
  ["focus:border-blue-500"]="focus:border-accent-02"
  ["focus:ring-blue-500"]="focus:ring-accent-02"
  ["border-blue-500"]="border-accent-02"

  # Pink
  ["bg-pink-400"]="bg-dark-surface"
  ["bg-pink-500"]="bg-dark-surface"
  ["bg-pink-600"]="bg-dark-surface"

  # Yellow
  ["bg-yellow-200"]="bg-dark-card"
  ["bg-yellow-300"]="bg-dark-card"
  ["bg-yellow-400"]="bg-dark-card"

  # Green
  ["bg-green-500"]="bg-accent-success"
  ["bg-green-600"]="bg-accent-success"

  # Red (errors → dark mode error token)
  ["bg-red-500"]="bg-accent-error"
  ["bg-red-600"]="bg-accent-error"

  # Light backgrounds
  ["bg-blue-50"]="bg-dark-background-01"
  ["dark:bg-blue-900/20"]="dark:bg-dark-background-01/40"
)

# Run replacements across app/
for pattern in "${!replacements[@]}"; do
  replacement=${replacements[$pattern]}
  echo "Replacing $pattern → $replacement"
  grep -rl "$pattern" ./app | while read -r file; do
    $SED "s/$pattern/$replacement/g" "$file"
  done
done

echo "✅ Neumorphic dark theme applied everywhere!"

