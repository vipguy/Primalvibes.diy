/**
 * Normalize various React component export patterns to a standard format.
 * This is a simplified version of the normalizeComponentExports from vibes.diy.
 */

export function normalizeComponentExports(code: string): string {
  // Clean up the code
  const cleanedCode = code
    .trim()
    .replace(/^\/\*[\s\S]*?\*\/\s*/, '')
    .replace(/\s*\/\*[\s\S]*?\*\/$/, '')
    .trim();

  // If it already has export default, return as-is
  if (cleanedCode.includes('export default')) {
    return cleanedCode;
  }

  // Handle function declarations
  const functionMatch = cleanedCode.match(/function\s+(\w+)\s*\(/);
  if (functionMatch) {
    const functionName = functionMatch[1];
    // If there's no export, add it
    if (!cleanedCode.includes(`export { ${functionName}`)) {
      return cleanedCode + `\nexport default ${functionName};`;
    }
  }

  // Handle const/let declarations
  const constMatch = cleanedCode.match(/(?:const|let)\s+(\w+)\s*=/);
  if (constMatch) {
    const varName = constMatch[1];
    // If there's no export, add it
    if (
      !cleanedCode.includes(`export { ${varName}`) &&
      !cleanedCode.includes(`export default ${varName}`)
    ) {
      return cleanedCode + `\nexport default ${varName};`;
    }
  }

  // If we can't determine the export pattern, return as-is
  // The component might already be properly formatted
  return cleanedCode;
}
