# Extract SimpleChat Tests - Restructure vibes.diy Tests to Match call-ai Pattern

## Goal
Reorganize vibes.diy tests to match call-ai structure: separate subdirectories with their own package.json and vitest configs.

## Current Structure
```
vibes.diy/tests/
├── package.json                    # Will be removed
├── vitest.config.ts               # Delegating config - will be removed  
├── vitest.tests.config.ts         # Actual app test config
├── vitest.useSimpleChat.config.ts # SimpleChat test config
├── useSimpleChat/                 # SimpleChat test directory
└── [all other test files]         # App test files
```

## Target Structure (matching call-ai)
```
vibes.diy/tests/
├── app/
│   ├── package.json               # NEW - copied from call-ai/tests/unit pattern
│   ├── vitest.config.ts          # MOVED from ../vitest.tests.config.ts
│   └── [all current test files]   # MOVED from ../
└── simple-chat/
    ├── package.json               # NEW - copied from call-ai/tests/integration pattern  
    ├── vitest.config.ts          # MOVED from ../vitest.useSimpleChat.config.ts
    └── [SimpleChat test files]   # MOVED from ../useSimpleChat/
```

## Implementation Steps

### 1. Create new directory structure
```bash
mkdir -p vibes.diy/tests/app
mkdir -p vibes.diy/tests/simple-chat
```

### 2. Move all existing test files to app/
```bash
# Move all test files except SimpleChat-related
find vibes.diy/tests/ -maxdepth 1 -name "*.ts" -o -name "*.tsx" | grep -v "vitest\|useSimpleChat" | xargs -I {} mv {} vibes.diy/tests/app/
mv vibes.diy/tests/utils/ vibes.diy/tests/app/
mv vibes.diy/tests/__mocks__/ vibes.diy/tests/app/
mv vibes.diy/tests/__screenshots__/ vibes.diy/tests/app/
```

### 3. Move SimpleChat files to simple-chat/
```bash
mv vibes.diy/tests/useSimpleChat/* vibes.diy/tests/simple-chat/
rmdir vibes.diy/tests/useSimpleChat/
```

### 4. Move and rename config files
```bash
mv vibes.diy/tests/vitest.tests.config.ts vibes.diy/tests/app/vitest.config.ts
mv vibes.diy/tests/vitest.useSimpleChat.config.ts vibes.diy/tests/simple-chat/vitest.config.ts
```

### 5. Create package.json files (copying from call-ai pattern)
- Copy `call-ai/tests/unit/package.json` structure for `vibes.diy/tests/app/package.json`
- Copy `call-ai/tests/integration/package.json` structure for `vibes.diy/tests/simple-chat/package.json`
- Adjust names appropriately (vibes-diy-app-tests, vibes-diy-simple-chat-tests)

### 6. Remove old files at tests/ root
```bash
rm vibes.diy/tests/package.json
rm vibes.diy/tests/vitest.config.ts
```

### 7. Update root vitest.config.ts
Change projects array to:
```typescript
projects: [
  "vibes.diy/tests/app/vitest.config.ts",
  "vibes.diy/tests/simple-chat/vitest.config.ts",
  "call-ai/tests/unit/vitest.config.ts", 
  "call-ai/tests/integration/vitest.config.ts",
  "use-vibes/tests/vitest.config.ts",
  "prompts/tests/vitest.node.config.ts",
  "prompts/tests/vitest.browser.config.ts",
]
```

## Benefits
- **Organized structure**: Clear separation between app tests and SimpleChat tests
- **Independent packages**: Each test suite can have its own dependencies and config
- **Consistent with call-ai**: Same pattern as existing successful test organization  
- **Scalable**: Easy to add more test packages in the future
- **Fixes environment issues**: Each package can have its own proper browser/node environment setup

This exactly matches the call-ai test organization pattern.