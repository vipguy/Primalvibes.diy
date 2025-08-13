export const coreImportMap = [
  "react",
  "react-dom",
  "react-dom/client",
  "use-fireproof",
  "call-ai",
  "use-vibes",
];

export function transformImports(code: string): string {
  return code.replace(
    // eslint-disable-next-line no-useless-escape
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"\/][^'"]*)['"];?/g,
    (match, importPath) => {
      if (coreImportMap.includes(importPath)) {
        return match;
      }
      return match.replace(`"${importPath}"`, `"https://esm.sh/${importPath}"`);
    },
  );
}
