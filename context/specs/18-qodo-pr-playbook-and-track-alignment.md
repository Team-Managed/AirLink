Read `00-product-map.md` before starting.
Also read `16-ci-workflows-and-governance.md` and `17-deep-qodo-integration-and-quality-harness.md`.

Define the exact PR workflow, branch-slicing playbook, interactive Qodo command audit trail, and submission criteria required to win the WeMakeDevs Q Branch Track ($5,000 prize for Best Code Quality with Qodo Gen & Qodo Merge).

## Implementation
1. Create PR Slicing & Branching Protocol:
   - Every implementation unit must be submitted as an independent, focused pull request following the branch naming standard: `feat/unit-XX-<name>` (e.g. `feat/unit-01-protocol-contracts`, `feat/unit-02-bridge-core-ring-buffer`).
   - PRs must remain compact (<400 lines of diff) so Qodo Merge can perform high-depth semantic analysis.
2. Define Mandatory Qodo PR Review Lifecycle (The 5-Step Proof of Quality):
   - **Step 1: Automated Initial Review & Description (`auto_review`, `auto_describe`):**
     - Upon opening the PR, Qodo Merge automatically generates the PR summary, effort-to-review score, security audit, and quality score badge.
   - **Step 2: Interactive Test Generation (`/test` command):**
     - In the PR comments, invoke `@qodo-merge /test` to request automated edge-case and boundary tests.
     - Commit the generated tests into the branch under `tests/qodo/`.
   - **Step 3: Interactive Code Improvement (`/improve` command):**
     - In the PR comments, invoke `@qodo-merge /improve` to request AI-driven code refactors and performance optimizations.
     - Review suggestions and apply commitable suggestion patches directly to the PR branch.
   - **Step 4: Interactive Architecture Alignment (`/ask` command):**
     - In the PR comments, invoke `@qodo-merge /ask "Verify that this PR does not violate the 180s approval timeout or zero-mocking invariants."`
     - Verify that Qodo responds with explicit architectural confirmation.
   - **Step 5: Final Review & Merge Approval (`/review` command):**
     - Run a final `@qodo-merge /review` to achieve 100% clean review score with zero unresolved security/quality flags before merging into `main`.
3. Create Standard PR Template (`.github/pull_request_template.md`):
   - Structured markdown template including:
     - **Unit & Spec Reference:** Link to the corresponding `context/specs/XX-....md` file.
     - **Summary of Changes:** Bulleted breakdown of what was implemented.
     - **Check When Done Verification:** Checked checklist matching the spec criteria.
     - **Test Evidence:** Output of `pnpm test` and coverage percentage.
     - **Qodo Quality Audit Section:** Placeholder for Qodo Merge review badges.
4. Establish Qodo Track Submission Section in `README.md`:
   - Dedicated section: `## 🏆 Q Branch Track: Automated Code Quality & Testing with Qodo`.
   - Table linking each merged PR to its public Qodo review comment trail, demonstrating automated reviews, test generations, and applied improvements.
   - Metrics summary: 100% PR review coverage, >90% test coverage via Qodo Gen, 0 unapproved code suppressions.

## Scope Limits
- Do not submit giant "dump everything in one PR" pull requests (each unit must have its own review trail).
- Do not merge PRs without an automated Qodo Merge review comment.
- Do not skip applying legitimate Qodo `/improve` recommendations.
- Do not fake test coverage or mock out core logic.

## Notes
- Hackathon judges will inspect the GitHub PR history to verify real Qodo usage during development, not just a static badge in the README.
- Demonstrating the full interactive loop (`/review`, `/improve`, `/test`, `/ask`) directly satisfies all Q Branch scoring criteria.
- Depends on: 00, 16, 17.

## Check When Done
- `.github/pull_request_template.md` is created and configured.
- Branching and PR slicing workflow is documented in `context/specs/00-product-map.md` and `context/ai-workflow-rules.md`.
- PR playbook guarantees every feature increment produces verifiable Qodo quality evidence.
