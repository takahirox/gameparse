# Development Flow

This document defines the default development flow for gameparse, with particular emphasis on AI-assisted development.

## 1. Start with an Issue

Work should begin with an Issue.

The Issue should clearly state:

- the problem
- the expected outcome
- relevant context

The Issue defines the scope of the work. If the scope is unclear, clarify the Issue before implementation instead of inventing requirements during the change.

By default, completion criteria should be executable and verifiable by an AI agent. Require human checks, such as physical-device testing, subjective evaluation, or external approval, only when there is a necessary reason to do so.

When human work is required, state why it is necessary and what result is expected. Distinguish optional additional validation from mandatory completion criteria.

Mandatory pre-merge acceptance criteria must be achievable and verifiable before merge. Record required verification possible only after merge separately in the Issue; it must not be a prerequisite for pre-merge PR approval. This separation does not waive implementation requirements or applicable pre-merge tests.

For example, when deployment is triggered by merge, validate the code and configuration, local builds, and applicable automated tests before merge. Verify successful publication and the newly published site after merge, reporting those checks as pending until performed.

For experiment changes, the [initial experiment contract](initial-experiment.md) and the applicable preregistered condition's acceptance requirements still apply. Do not claim unperformed checks passed.

## 2. Create a Pull Request for the Issue

Implementation should be proposed through a Pull Request associated with the Issue.

The Pull Request should explain:

- what changed
- what outcome the change produces
- how the change was validated
- which Issue it addresses

Report pre-merge validation results and required post-merge verification separately. Keep post-merge checks marked pending until performed, and report their actual results afterward. Do not present pending verification as passed or the outcome as fully verified.

A Pull Request should only claim to close an Issue when it fully addresses that Issue.

If the Pull Request intentionally implements only part of the Issue, it should state that clearly and should not present the Issue as fully resolved.

## 3. Review Before Merge

Every Pull Request should be reviewed before merge.

A central review question is:

> Does this Pull Request address the Issue completely, without adding changes that are not justified by the Issue?

Review must check both directions:

- **No missing scope:** the Pull Request should not leave required parts of the Issue unresolved while claiming completion.
- **No unnecessary scope:** the Pull Request should not introduce unrelated abstractions, frameworks, policies, or complexity beyond what is needed to solve the Issue.

Use the [review guidelines](review-guidelines.md#check-validation-timing) to assess validation timing. A Pull Request may be approved when implementation requirements and mandatory pre-merge acceptance criteria are satisfied and required post-merge checks are recorded as pending. Pending post-merge verification is separate from missing implementation or insufficient pre-merge validation.

This is especially important for AI-generated changes. AI agents may produce broader or more elaborate designs than the task requires. Prefer the smallest change that fully satisfies the Issue.

## 4. Revise Until Review Passes

If review finds missing requirements, unnecessary scope, correctness problems, or insufficient validation, update the Pull Request and review it again.

The Pull Request should be merged only when the reviewed change is an appropriate and complete response to the Issue.

## 5. Merge

After review passes, merge the Pull Request.

## 6. Perform Post-Merge Verification

Perform the required post-merge checks recorded in the Issue and Pull Request, then update their pending status with the actual results and evidence. If a check fails or cannot be performed, report that status accurately and track the remaining work.

The normal flow is therefore:

```text
Issue
  ↓
Implementation
  ↓
Pull Request
  ↓
Review
  ↓
Revision if needed
  ↓
Merge
  ↓
Post-merge verification (if required)
```
