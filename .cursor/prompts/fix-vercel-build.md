# Fix Vercel Build Issues

## Overview

This prompt guides you to diagnose and fix Vercel build failures by retrieving the latest deployment build logs through the Vercel MCP server, analyzing the errors, and creating a comprehensive fix plan following the refine-plan guidelines.

## Step 1: Project Identification

### If Project Name is Provided

1. Use `mcp_vercel_list_projects` to retrieve all available Vercel projects
2. If multiple projects match the provided name (partial or exact), **ask the user to confirm which specific project** before proceeding
3. Extract the `projectId` and `teamId` from the selected project

### If No Project Name is Provided

1. Check for `.vercel/project.json` file in the workspace to get the project ID
2. If not found, use `mcp_vercel_list_projects` and ask the user to select a project
3. Extract the `projectId` and `teamId` from the selected project

## Step 2: Retrieve Latest Deployment and Build Logs

1. Use `mcp_vercel_list_deployments` with the identified `projectId` and `teamId` to get recent deployments
2. Identify the latest deployment (check `createdAt` timestamp)
3. Use `mcp_vercel_get_deployment_build_logs` with the latest deployment ID to retrieve build logs
4. Analyze the build logs to identify all failure points, errors, and warnings

## Step 3: Error Analysis

For each distinct error or failure:

1. **Categorize the error type:**
   - Dependency installation failures
   - Build script errors
   - Type checking failures
   - Linting errors
   - Test failures
   - Configuration issues
   - Environment variable problems
   - Resource/rate limit issues

2. **Identify root causes:**
   - Missing dependencies
   - Version incompatibilities
   - Configuration mismatches
   - Environment-specific issues
   - Code errors or type issues

3. **Document findings:**
   - Error message and stack trace
   - File and line numbers where applicable
   - Context around the failure
   - Related dependencies or configuration

## Step 4: Create Fix Plan Following refine-plan.md Guidelines

Refine your plan using the checklist below. Update your plan so it explicitly addresses each area:

### 1. Dependency and Resource Management

- Ensure all dependencies are managed with the appropriate initialization and retrieval methods required by your stack
- Avoid manual instantiation where the environment expects other patterns (like dependency injection)
- Confirm setup occurs after all needed resources are available and compatible with test harnesses
- **For Vercel builds:** Verify `package.json` dependencies, ensure build scripts are correct, check for missing peer dependencies

### 2. Robust Error and Rate Limit Handling

- Prioritize structured approaches to error codes and response types (such as 429 rate limits)
- Retain fallbacks for variations in error messages or response formats
- **For Vercel builds:** Handle Vercel-specific rate limits, API quotas, and build timeout issues

### 3. Authentication and Environment Context in Testing

- Clearly distinguish between authentication flows in real usage and test scenarios
- Document all relevant shortcuts or bypasses utilized by the test harness
- Adjust test expectations to align with these realities
- **For Vercel builds:** Ensure environment variables are properly configured in Vercel dashboard

### 4. Black-Box Test Discipline

- Tests should only interface with the system through public contracts (such as HTTP APIs)
- Prohibit direct access to internals or imported types—assertions must use exported runtime contracts or schemas
- **For Vercel builds:** Verify tests don't rely on local-only resources or file system paths

### 5. Contract and Response Stability

- Ensure all plan changes are consistent with public contracts, types, and documented interface expectations
- Where changes are required, update contracts first, then implementations and tests
- **For Vercel builds:** Ensure build outputs match expected structure and API contracts

### 6. Public Interface Error Consistency (Optional)

- Guarantee any disabled or missing routes return consistent, contract-compliant errors
- **For Vercel builds:** Verify error responses are properly formatted for production

### 7. Compatibility and Containment

- Do not alter unrelated configuration, infrastructure, or build/test setup
- Limit the impact of changes to the intended files and logic only
- **For Vercel builds:** Only modify `vercel.json`, build scripts, or dependencies as needed for the specific build failure

### 8. Plan Output Structure

- List exact files and code regions to update
- Explain briefly why each fix is needed and how to verify it
- Include verification steps (e.g., "Run `pnpm build` locally to verify the fix")

## Step 5: Present the Plan

Structure your output as follows:

1. **Summary of Build Failures**
   - List each distinct error with its category and root cause
   - Include relevant log excerpts

2. **Fix Plan**
   - For each error, provide:
     - File(s) to modify
     - Specific code changes needed
     - Rationale for the fix
     - Verification steps

3. **Verification Checklist**
   - Steps to verify fixes work locally
   - Commands to test the build
   - Expected outcomes

## Important Notes

- Always use Vercel MCP tools (`mcp_vercel_*`) rather than manual CLI commands
- If build logs are truncated, request more lines using the `limit` parameter
- Consider both immediate fixes and preventive measures (e.g., adding missing type checks, improving error handling)
- Ensure fixes maintain compatibility with the existing codebase and don't break other functionality
- After creating the plan, wait for user approval before implementing fixes
