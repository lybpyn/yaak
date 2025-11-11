# Test Workflows Feature - Deployment Checklist

## Pre-Deployment Verification

### 1. Build Setup ✓
```bash
# Run bootstrap to setup build tools
npm run bootstrap

# This will install:
# - yaakcli (Yaak CLI for plugin building)
# - wasm-pack (for yaak-templates WASM build)
# - Node.js binary
# - Protoc binary
```

### 2. Database Migration ✓
- [x] Migration file created: `20251109162448_workflows.sql`
- [x] Creates 4 tables: workflows, workflow_steps, workflow_executions, workflow_step_executions
- [ ] **TODO**: Run app once to apply migration automatically

### 3. Backend Code ✓
- [x] Rust models implemented in `yaak-models/src/models.rs`
- [x] Query functions in `yaak-models/src/queries/`
- [x] Template extensions in `yaak-templates/src/`
- [x] Execution engine in `src-tauri/src/workflow_execution.rs`
- [x] Tauri commands registered in `src-tauri/src/lib.rs`
- [ ] **TODO**: Verify Rust compilation with `cargo check` (in src-tauri/)

### 4. Frontend Code ✓
- [x] Jotai atoms in `yaak-models/guest-js/atoms.ts`
- [x] React hooks in `src-web/hooks/`
- [x] UI components in `src-web/components/Workflows/`
- [x] Routes in `src-web/routes/workspaces/$workspaceId/workflows/`
- [x] Integration in WorkspaceHeader and CreateDropdown
- [ ] **TODO**: Verify TypeScript compilation (npm run build when tools are ready)

### 5. Testing ✓
- [x] Unit test files created (7 files)
- [x] Manual testing checklist (`MANUAL_TESTING.md`)
- [ ] **TODO**: Configure Vitest in src-web/package.json
- [ ] **TODO**: Run automated tests: `npm test`
- [ ] **TODO**: Complete manual testing (24 scenarios)

### 6. Documentation ✓
- [x] User guide: `specs/test-workflows/USER_GUIDE.md`
- [x] Technical design: `specs/test-workflows/design.md`
- [x] Requirements: `specs/test-workflows/requirements.md`
- [x] CLAUDE.md updated with workflow architecture

## Development Testing Steps

### Step 1: Setup Environment
```bash
cd /home/ll/develop/yaak

# Install dependencies
npm install

# Bootstrap build tools
npm run bootstrap
```

### Step 2: Start Development Server
```bash
# Start Tauri dev mode
npm start

# App will open with hot-reload enabled
```

### Step 3: Navigate to Workflows
1. Open any workspace
2. Click "Workflows" button in WorkspaceHeader (should show count: 0)
3. Or use CreateDropdown → "Workflow"
4. Or navigate to: `/workspaces/{workspace-id}/workflows`

### Step 4: Create Test Workflow
1. Click "New Workflow" button
2. Enter name: "Test Workflow"
3. Enter description (optional)
4. Save workflow

### Step 5: Add Steps
1. Click "Add Step" button
2. Select an existing HTTP or gRPC request
3. Step should appear in list
4. Drag to reorder if needed

### Step 6: Execute Workflow
1. Click "Run Workflow" button
2. Select environment (or use default)
3. Watch real-time execution progress
4. View results when complete

### Step 7: Test Data Passing
1. Create request 1: GET `https://api.example.com/auth` → Returns `{"token": "abc123"}`
2. Create request 2: GET `https://api.example.com/user`
3. In request 2, add header: `Authorization: Bearer {{workflow.step[0].response.body.token}}`
4. Add both to workflow
5. Execute workflow
6. Verify step 2 used token from step 1

## Known Build Issues

### Issue 1: npm run build fails with missing tools
**Cause**: Build tools not bootstrapped
**Solution**: Run `npm run bootstrap` first

### Issue 2: TypeScript errors in existing plugins
**Cause**: Pre-existing issues in plugin code (not workflow-related)
**Solution**: These can be ignored for workflow feature testing

### Issue 3: wasm-pack not found
**Cause**: wasm-pack not installed globally
**Solution**: `cargo install wasm-pack` or run `npm run bootstrap`

## Production Deployment

### Pre-deployment Checklist
- [ ] All automated tests passing
- [ ] Manual testing completed (24/24 scenarios)
- [ ] Documentation reviewed and updated
- [ ] Performance tested with large workflows (50+ steps)
- [ ] Error handling verified for all edge cases
- [ ] Accessibility audit completed
- [ ] Code review approved

### Deployment Steps
1. Merge feature branch to main
2. Run full build: `npm run app-build`
3. Test production build locally
4. Deploy to staging environment
5. Run smoke tests
6. Deploy to production
7. Monitor for errors

### Post-Deployment Monitoring
- Watch for database migration issues
- Monitor execution performance
- Track user feedback
- Check error logs for workflow execution failures

## Rollback Plan

If critical issues are discovered:
1. Disable workflows feature in UI (feature flag if available)
2. Revert database migration if data corruption detected
3. Roll back to previous release version
4. Investigate and fix issues
5. Re-deploy after verification

## Feature Flags (Recommended)

Consider adding feature flag for gradual rollout:
```rust
// In lib.rs or config
const WORKFLOWS_ENABLED: bool = env!("YAAK_WORKFLOWS_ENABLED") == "true";
```

This allows:
- Gradual rollout to subset of users
- Quick disable if issues found
- A/B testing
- Beta testing period

## Success Metrics

Track these metrics post-deployment:
- Number of workflows created
- Number of workflow executions
- Average workflow execution time
- Execution success/failure rates
- User adoption rate
- Support tickets related to workflows

## Support Resources

- Technical design: `specs/test-workflows/design.md`
- User guide: `specs/test-workflows/USER_GUIDE.md`
- Manual testing: `specs/test-workflows/MANUAL_TESTING.md`
- Developer docs: `CLAUDE.md` (Test Workflows section)
