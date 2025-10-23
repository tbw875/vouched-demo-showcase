# CLAUDE.md Template

This file provides mandatory instructions for Claude Code when working in this repository. All numbered items are REQUIRED and must be followed in sequence.

## 1. SESSION INITIALIZATION (REQUIRED BEFORE ANY WORK)

### 1.1 Startup Sequence
1. Read this entire CLAUDE.md file
2. Review project-specific setup requirements (check README.md or package.json scripts)
3. Clear any necessary caches or build artifacts
4. Start development server if applicable
5. Verify current git branch and version alignment

### 1.2 Session Response Format
Every response MUST include these sections in order:
1. **Rule Compliance**: List specific CLAUDE.md rules being followed (by section number)
2. **Verification Checklist**: ✅ Uses existing APIs ✅ No hardcoded values ✅ Fixes root problem
3. **Systems Used**: List specific APIs, utilities, or components being leveraged
4. **Files Modified**: List all files created/updated with paths
5. **Documentation Updates**: Show exact files created/updated in /docs/

### 1.3 Response Self-Check (BEFORE SUBMITTING ANY RESPONSE)
□ Did I follow section 1.2 response format?
□ Did I create/update /docs/ files (Section 5)?
□ Did I list which CLAUDE.md rules I followed?
□ Did I avoid all items in Section 3.1?
□ If writing code, did I get explicit approval first (Section 2.1)?
□ Is my response factual without assumptions (Section 2.3)?
□ Did I check for existing APIs first (Section 2.4)?

## 2. BEFORE WRITING ANY CODE

### 2.1 Pre-Code Requirements
1. Ask clarifying questions about the requirement
2. Request to see relevant existing code files
3. Write: "PROPOSED APPROACH:" followed by detailed plan
4. Wait for user response containing "approved", "confirmed", or "proceed"
5. If user hasn't explicitly confirmed, ask: "Should I proceed with this approach?"
6. DO NOT WRITE CODE without explicit approval

### 2.2 Pre-Code Verification Checklist
1. Check if solution uses existing APIs and utilities
2. Verify solution is dynamic and data-driven (no hardcoded values)
3. Read documentation for any functions being modified
4. Confirm fix addresses root problem (not just symptoms)
5. Review specific rules for this task type

### 2.3 Factual Response Requirements
1. **State only what you have verified** - Never assume functionality or behavior
2. **Read before claiming** - Check actual code/docs before stating capabilities
3. **Use precise language**:
   - "I found..." / "The code shows..." (when you've verified)
   - "I need to check..." / "Let me verify..." (when uncertain)
   - "I cannot find..." (when something doesn't exist)
4. **Never assume**:
   - File locations without checking
   - Function behaviors without reading code
   - Data structures without inspecting
   - API responses without documentation
5. **When uncertain, always**:
   - Ask to see the specific file
   - Request clarification
   - State "I need more information about..."

### 2.4 Mandatory API Discovery Process
Before creating ANY new function, API, or utility:
1. **Search existing codebase**:
   - Check common directories for utilities, APIs, hooks, components
   - Search for similar functionality patterns
   - List all similar functions found
2. **Read existing documentation**:
   - Check `/docs/` directory for existing documentation
   - Review inline code documentation and comments
3. **Verify non-existence**:
   - State: "I searched for [functionality] and found: [list]"
   - Explain why existing solutions don't work (if any found)
   - Get approval to create new: "No existing solution found. Create new?"
4. **If similar exists**:
   - Extend/modify existing rather than creating new
   - Document the enhancement in relevant /docs/ file
   - Update existing tests

## 3. DEVELOPMENT STANDARDS

### 3.1 Absolute Prohibitions
1. NEVER use placeholder values (0, 'TBD', 'TODO', 'N/A' as actual data)
2. NEVER hardcode specific domain values (user names, IDs, dates, business-specific data)
3. NEVER create fallback logic instead of fixing root problems
4. NEVER use temporary solutions or "quick fixes"
5. NEVER ignore existing APIs in favor of new logic
6. NEVER alter files that are managed by external systems or syncs
7. NEVER revert to a clean state without understanding what was lost
8. NEVER reproduce copyrighted content
9. NEVER assume functionality without reading actual code
10. NEVER create duplicate utilities/APIs without checking existing ones

### 3.2 Code Implementation Rules
1. Use TypeScript with strict typing - define interfaces for all props and state
2. Use functional components with React hooks (if React project)
3. Follow project-specific component patterns and conventions
4. Import and use existing utilities - check the codebase first
5. Add proper error handling for all async operations
6. Follow project architecture patterns (check existing code for examples)

### 3.3 UI/UX Standards
*Customize this section based on your project's design system*
1. Follow established layout patterns in the codebase
2. Use project design tokens (colors, spacing, typography)
3. Maintain responsive design standards
4. Apply consistent text overflow and truncation handling
5. Use shared component libraries and utilities

### 3.4 Data Integrity
1. Calculate dynamic values from data (never hardcode)
2. Use data-driven approaches for all values
3. Preserve user state appropriately
4. Handle loading and error states consistently
5. Validate data existence before operations

## 4. TESTING AND VERIFICATION

### 4.1 Testing Requirements
1. Clear relevant caches when testing changes
2. Use hard refresh for UI changes when needed
3. Test in clean state (incognito/private browsing)
4. Verify no console errors
5. Confirm responsive design works across viewports

### 4.2 Error Handling
1. FIX errors immediately (don't just describe them)
2. Add try-catch blocks for all async operations
3. Provide meaningful error messages to users
4. Log errors appropriately for debugging

### 4.3 Verification Before Claiming Success
1. **Never state "this should work" without testing**
2. **Never say "successfully implemented" without user confirmation**
3. **Required verification steps**:
   - Run the code and check for errors
   - Test the actual functionality
   - Verify output matches requirements
4. **Use factual status updates**:
   - "Code written and ready for testing"
   - "Implementation complete, awaiting your verification"
   - "Changes made, please test and confirm"

## 5. DOCUMENTATION (REQUIRED AFTER EVERY TASK)

### 5.1 Documentation Requirements
Every response that involves development MUST end with:
1. Create/update feature documentation in `/docs/features/[feature-name].md`
2. Create/update API documentation in `/docs/api/[endpoint-name].md`
3. Create/update component documentation in `/docs/components/[component-name].md`
4. Update `/docs/CONTEXT.md` with:
   - Current development status
   - Technical decisions and reasoning
   - Immediate next steps
5. Document any new utilities in `/docs/utils/[utility-name].md`
6. **Release Notes**: When working on a version:
   - Check if `/docs/releases/v[version]-release-notes.md` exists
   - If it exists, UPDATE it - don't overwrite
   - Add new features/fixes to existing sections
   - Keep previous work intact

### 5.1.1 Documentation Checkpoint
**STOP. Before proceeding to next task or responding:**
- Have you created/updated files in /docs/? List them.
- If no documentation written, return to section 5.1 and complete.
- Documentation MUST be shown at end of response.

### 5.2 Documentation Format
```markdown
# [Component/Feature/API Name]

## Overview
[Brief description]

## Usage
[Code example]

## Configuration
[Options and parameters]

## Dependencies
[Required imports and utilities]

## Implementation Notes
[Technical details and decisions]

## Last Updated
[Date and version]
```

### 5.3 Session Summary
At session end, create: `/docs/sessions/[date]-[version]-[main-feature]-summary.md`

## 6. GIT OPERATIONS

### 6.1 Commit Rules
1. ONLY commit when user explicitly says "commit" or similar command
2. Ask for confirmation if commit intent is unclear
3. Never mark as "successful" or "completed" without user confirmation
4. Use descriptive commit messages referencing ticket/feature

### 6.2 Branch Strategy
*Customize based on your workflow - examples below:*
1. Work in feature/version branches (e.g., `feature/login`, `v1.1.5`)
2. Never work directly on main/production branch
3. Follow team's branching strategy (GitFlow, trunk-based, etc.)

## 7. COMMUNICATION STANDARDS

### 7.1 Response Style
1. No hyperbole or assumptions
2. Use factual, neutral language
3. Reference actual project requirements and specifications
4. Be honest - say "I don't know" when uncertain
5. Don't use phrases like "absolutely right" or similar flattery
6. State only verified information from actual code/documentation

### 7.2 Release Notes Format
When requested, format appropriately for your team:
1. Order by highest value/impact
2. Write at appropriate reading level for your audience
3. Brief summary at top with biggest news
4. Organize by categories (Features, Fixes, Improvements, etc.)
5. Factual content without hyperbole
6. Include relevant technical details for your audience

**Release Notes Research Process:**
When asked to generate release notes:
1. **Check production version first** (if version endpoint exists)
2. **Examine all commits** since last release
3. **Review all code changes** - actual implementation details
4. **Read all documentation** created in `/docs/` directories
5. **Note**: Multiple version bumps may be combined into one release

## 8. BUILD AND DEPLOYMENT

### 8.1 Build Commands
*Customize based on your project - examples:*
- `npm run dev` or `yarn dev` - Development server
- `npm run build` or `yarn build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Run linter

### 8.2 Deployment Workflow
*Customize this section entirely based on your deployment setup*

**General Deployment Best Practices:**
1. Always verify you're on the correct branch before deploying
2. Commit all changes before deployment
3. Push changes to remote repository
4. Run pre-deployment checks/tests
5. Follow project-specific deployment commands
6. Verify deployment success

### 8.3 Deployment Commands
*Document your project's specific deployment commands here*

### 8.4 Common Issues & Fixes
*Document common deployment issues specific to your project*

### 8.5 Branch and Deployment Policy
*Define your project's specific policies here*

## 9. END OF VERSION PROCESS

### 9.0 Session vs Version Closure
**IMPORTANT DISTINCTION**:
- **Session Closure**: When user says "complete session", "end session", or similar
  - Create session documentation
  - Update CONTEXT.md
  - Update release notes if applicable
  - DO NOT bump version or create new branches
- **Version Closure**: When user explicitly says to start a new version
  - Only then follow version creation process

### 9.1 Pre-Deployment Checklist
Before closing a version:
1. Ensure all code changes are committed
2. Create/update all required documentation in `/docs/`
3. Push all commits to origin
4. Run tests and build checks
5. Deploy to production using project workflow
6. Verify deployment is successful

### 9.2 Version Tagging (If Applicable)
*Customize based on your versioning strategy*

### 9.3 Required Documentation for Version Closure
Each version MUST include:
- `/docs/sessions/[date]-[version]-[feature]-summary.md` - Session work summary (one per session)
- `/docs/releases/v[version]-release-notes.md` - Technical release notes
  - **IMPORTANT**: If release notes already exist for the current version, UPDATE them with new details
  - DO NOT overwrite existing release notes - append new features/fixes to existing content
  - Maintain chronological order with latest changes at the top of each section
  - Preserve all previous work documented in the release notes
- Updated `/docs/CONTEXT.md` with latest changes (update after each session)
- Any new API/component documentation created during development

**Multi-Session Version Development:**
- Versions often take multiple Claude Code sessions to complete
- Each session creates its own `/docs/sessions/[date]-[version]-[feature]-summary.md`
- All sessions contribute to the same `/docs/releases/v[version]-release-notes.md`
- CONTEXT.md reflects the cumulative state across all sessions

### 9.4 Starting Next Version (USER INITIATED ONLY)
**IMPORTANT**: NEVER create a new version branch or bump version numbers unless the user explicitly requests it with phrases like:
- "start next version"
- "create v1.3.1"
- "bump version"
- "begin new version"

When the USER EXPLICITLY requests a new version:
1. Verify current version is deployed and stable
2. Create new version branch following project conventions
3. Update version in package.json or relevant files
4. Commit version bump
5. Push new branch
6. Deploy if needed
7. Continue development on new version branch

### 9.5 Version Numbering Guidelines
Follow [Semantic Versioning](https://semver.org/):
- **Patch** (1.2.5 → 1.2.6): Bug fixes, minor improvements
- **Minor** (1.2.5 → 1.3.0): New features, non-breaking changes
- **Major** (1.2.5 → 2.0.0): Breaking changes, major overhauls

## 10. CONVERSATION CHECKPOINTS

### 10.1 Every 5 Responses Checkpoint
Every 5 responses, you MUST:
1. State: "**Performing CLAUDE.md checkpoint #[number]**"
2. List last 5 documentation updates with file paths
3. Confirm no hardcoded values used in last 5 responses
4. Confirm all statements were factual (no assumptions made)
5. List any existing APIs/utilities leveraged
6. If documentation missing, create it now before continuing

### 10.2 Conversation Drift Prevention
If conversation exceeds 20 responses:
1. Re-read entire CLAUDE.md file
2. Re-read relevant /docs/ files for current task
3. Summarize current task status in `/docs/CONTEXT.md`
4. List all /docs/ files created/updated this session
5. Verify still following numbered workflow sequence

### 10.3 Context Loss Recovery
If unsure about current requirements:
1. STOP immediately
2. Ask user: "What is our current task?"
3. Re-read relevant CLAUDE.md sections
4. Review recent documentation updates
5. Read relevant code files before making claims
6. Confirm approach before continuing

---

## Customization Guide

When adapting this template for your project:

1. **Section 1.1**: Add your specific startup commands and cache clearing steps
2. **Section 3.2**: List your project's specific utilities and patterns
3. **Section 3.3**: Define your design system and UI standards
4. **Section 4.1**: Add your testing setup and cache clearing commands
5. **Section 8**: Completely customize for your deployment infrastructure
6. **Throughout**: Replace generic examples with project-specific ones

The goal is to maintain the rigorous workflow and quality standards while adapting to your specific technical stack and processes.
