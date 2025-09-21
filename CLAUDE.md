# Claude Development Notes

## Vibes App Development Guide

**NOTE**: For creating individual Vibes (React components), see `notes/vibes-app-jsx.md`. The instructions in that file are for building apps WITH this platform, NOT for working on this repository itself.

## Code Quality Standards

### Linting and TypeScript

- **Always run `pnpm check`** before submitting changes - this runs format, build, test, and lint
- **ESLint configuration**: Uses strict TypeScript rules with custom ignores in `eslint.config.mjs`
- **No `any` types**: Replace with proper types like `unknown`, specific interfaces, or union types
- **Unused variables**: Remove entirely or prefix with `_` only for function parameters that must exist for API compliance
- **Remove unused code**: Delete unused imports, interfaces, and parameters completely rather than prefixing

### TypeScript Best Practices

- **Document interface properties**: Use correct property names from type definitions (e.g., `_id` not `messageId` for Fireproof documents)
- **Function signatures**: Match actual implementation types exactly (e.g., navigate function should match React Router's signature)
- **Type imports**: Use `import type` for type-only imports to improve build performance

### Debug and Development Code

- **Console logs**: Remove all `console.log` statements from production code before committing
- **Debug files**: Place browser debugging scripts in `claude-browse-vibes/` directory which is ignored by ESLint
- **Temporary code**: Remove commented debug code and temporary logging before finalizing changes

### React Patterns

- **Interface naming**: Use descriptive names without generic prefixes (e.g., `SessionViewProps` not `Props`)
- **Unused props**: Remove from interface and function signature entirely rather than keeping with `_` prefix
- **Component parameters**: Only include props that are actually used by the component

## Tests

Run vibes.diy tests: `cd vibes.diy/tests && pnpm test`
Run vibes.diy tests (quiet): `cd vibes.diy/tests && pnpm test --reporter=dot`

## Call-AI Release Process

**IMPORTANT**: Never manually update version numbers in `call-ai/pkg/package.json`. The CI/CD system handles all versioning automatically based on git tags.

### Production Release

To release a new call-ai version:

1. **Create Git Tag**: `git tag call-ai@v0.12.1 -m "Release message"` (use semantic version)
2. **Push Tag**: `git push origin call-ai@v0.12.1`
3. **Confirm GitHub Actions**: The CI will automatically extract the version from the tag and publish to npm

### Dev Release Process

To test call-ai fixes by releasing a dev version:

1. **Create Git Tag**: `git tag call-ai@v0.0.0-dev-prompts && git push origin call-ai@v0.0.0-dev-prompts`
2. **Confirm GitHub Actions**: Approve the manual step in the triggered workflow
3. **Verify NPM Dev Channel**: Check `npm view call-ai versions --json` for the new dev version

The CI reads the version from the git tag (not from package.json) and publishes accordingly. The `call-ai/pkg/package.json` version stays at `0.0.0` as a placeholder.

## Dependency Management

### PNPM Workspace System

This repository uses PNPM workspaces to manage a monorepo structure with multiple packages:

- **Root package.json**: Contains monorepo-level dependencies and scripts that coordinate across packages
- **Individual package directories**: Each has its own `package.json` with specific dependencies
- **Dependency installation**: Run `pnpm install` from the root to install all workspace dependencies
- **Adding dependencies**: 
  - Root-level: `pnpm add <package>` (affects the entire monorepo)
  - Specific workspace: `pnpm add <package> --filter <workspace-name>`
- **Script execution**: Scripts in root package.json often delegate to specific workspace packages
- **Shared dependencies**: Common dependencies are hoisted to the root `node_modules` when possible
