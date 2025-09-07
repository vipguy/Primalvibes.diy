# Testing Call-AI Dev Version in Main Branch

## Current Situation
- ✅ CLAUDE.md updated with dev release process
- Current branch: `mabels/vibes.diy-prompts` with working schema fixes
- Main branch: Uses `call-ai@0.10.2` with broken schema (returns undefined)
- Need to test if current branch's call-ai fixes work when published

## Steps

1. **Release Call-AI Dev Version**
   - Create git tag: `call-ai@v0.0.0-dev-prompts` 
   - Push tag: `git push origin call-ai@v0.0.0-dev-prompts`
   - Monitor GitHub Actions for workflow trigger
   - Approve manual confirmation step in GitHub workflow

2. **Verify NPM Publication**
   - Check: `npm view call-ai versions --json | grep "0.0.0-dev-prompts"`
   - Confirm new dev version appears in registry

3. **Test in Main Branch**
   - Switch: `git checkout main`  
   - Temporarily update `vibes.diy/pkg/package.json`: `"call-ai": "0.0.0-dev-prompts"`
   - Install: `pnpm install` to get published dev version
   - Run wire-level logging test to compare schema behavior
   - Check if schema now returns JSON instead of undefined

4. **Compare & Document**
   - Current branch: ✅ Schema works (JSON response)
   - Main + old call-ai: ❌ Schema broken (undefined response)  
   - Main + new call-ai: ? Test if schema now works
   - Document whether the fix is in call-ai library vs environment

5. **Cleanup**
   - Revert main branch package.json changes
   - Return to current branch for continued development

## Expected Outcome

If the schema fix is in the call-ai library itself, then main branch + new call-ai should work properly. If it's an environment/workspace issue, the problem will persist even with the new call-ai version.