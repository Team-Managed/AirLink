import type { Skill } from "./types.js";
import { parseSkillMarkdown } from "./skill-parser.js";

const GIT_WORKFLOW_SKILL = `---
name: git-workflow-and-versioning
description: Structures git workflow practices. Use when making any code change, committing, branching, creating PRs, or version bumps.
triggers:
  - git
  - commit
  - branch
  - pull request
  - pr
  - version
---
# Git Workflow and Versioning Protocol
1. **Trunk-Based Focus:** Keep main deployable. Create focused, short-lived branches.
2. **Atomic Commits:** Each commit does one logical thing (e.g. feat: ..., fix: ..., refactor: ..., test: ...).
3. **Verify Before Staging:** Always run tests and typechecks before committing.
4. **Descriptive Descriptions:** Summarize the rationale and changes clearly with bullet points.
5. **No Dangerous Force Flags:** Never use force pushes or bypass CI verifications.`;

const TDD_SKILL = `---
name: test-driven-development
description: Test-driven implementation and bug fixing workflow. Use when implementing any feature or fixing any bug before writing implementation code.
triggers:
  - test
  - tdd
  - failing test
  - assertion
  - unit test
---
# Test-Driven Development (TDD) Protocol
1. **Identify Expected Behavior:** Clearly state requirements and edge cases.
2. **Write Focused Test First:** Write a minimal failing test that reproduces the bug or asserts the new requirement.
3. **Run Test & Confirm Red:** Execute the test suite to observe the clean failure.
4. **Implement Minimal Fix:** Write only the code required to make the test pass.
5. **Run Test & Confirm Green:** Re-run the suite to verify the fix without regressions.
6. **Refactor Cleanly:** Clean up code structure while keeping all tests passing.`;

const CODE_REVIEW_SKILL = `---
name: code-review-and-quality
description: Deep code review, quality audits, and security inspection aligned with Qodo standards. Use when completing tasks, reviewing diffs, or preparing PRs.
triggers:
  - review
  - code quality
  - security
  - inspect diff
  - qodo
---
# Code Review and Quality Protocol
1. **Security Inspection:** Check for credential exposure, command injection, path traversal, and unhandled exceptions.
2. **Quality & Maintainability:** Verify type safety (no untyped any casts or suppressed lints), readability, and absence of hardcoded outputs.
3. **Test Integrity:** Ensure all code paths have active tests with real assertions (no trivial passes).
4. **Scope Discipline:** Confirm that only files required for the task were modified.
5. **Clear Findings:** Report findings categorized by Severity (High, Medium, Low) with concrete fixes.`;

const SYSTEMATIC_DEBUGGING_SKILL = `---
name: systematic-debugging
description: Root-cause debugging protocol. Use when encountering unexpected errors, crashes, test failures, or regressions.
triggers:
  - debug
  - bug
  - error
  - crash
  - failure
  - unexpected
---
# Systematic Debugging Protocol
1. **Observe and Isolate:** Capture exact error message, stack trace, and environment context.
2. **Form Hypothesis:** Formulate testable hypotheses regarding the root cause.
3. **Trace Code Path:** Trace variables and call stacks to verify the exact failure point.
4. **Minimal Targeted Patch:** Implement a minimal fix addressing the root cause rather than patching symptoms.
5. **Regression Verification:** Run tests to confirm the fix and prevent future regressions.`;

const ISSUE_RESOLVER_SKILL = `---
name: issue-resolver
description: End-to-end GitHub issue resolution workflow. Use when asked to fix or resolve a specific issue or ticket.
triggers:
  - issue
  - resolve issue
  - fix issue
  - ticket
---
# GitHub Issue Resolution Protocol
1. **Ingest Issue Spec:** Fetch issue title, body, reproduction steps, and expected outcome.
2. **Locate Relevant Files:** Use search and read tools to identify affected modules.
3. **Reproduce with Test:** Write a test case reproducing the reported issue.
4. **Apply Patch:** Implement the fix in the affected source files.
5. **Verify & Review Diff:** Run full test suite and inspect git diff before submitting.`;

export const BUILTIN_SKILLS: Skill[] = [
  parseSkillMarkdown(GIT_WORKFLOW_SKILL, "builtin/git-workflow-and-versioning/SKILL.md", true),
  parseSkillMarkdown(TDD_SKILL, "builtin/test-driven-development/SKILL.md", true),
  parseSkillMarkdown(CODE_REVIEW_SKILL, "builtin/code-review-and-quality/SKILL.md", true),
  parseSkillMarkdown(SYSTEMATIC_DEBUGGING_SKILL, "builtin/systematic-debugging/SKILL.md", true),
  parseSkillMarkdown(ISSUE_RESOLVER_SKILL, "builtin/issue-resolver/SKILL.md", true),
];
