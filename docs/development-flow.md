# Development Flow

This document defines the default development flow for gameparse, with particular emphasis on AI-assisted development.

Use the [testing and CI principles](#testing-and-ci-principles) when choosing validation and reviewing its cost.

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

## Testing and CI Principles

**Detect the required failures at the lightest appropriate layer, without redundant execution.** Preserve required correctness, regressions, and meaningful integration coverage when moving or consolidating checks.

Current checks are `npm test` (Node's test runner over `test/*.test.mjs`, including evaluation, vision, evidence validation, and server boundaries) and `npm run test:browser` (real-Chrome capture/reset, input delivery, evidence integrity, and cancellation/cleanup). Full experiments use Chrome and isolated Docker workers under the [initial experiment contract](initial-experiment.md) and [controlled-clock condition](experiments/controlled-clock.md); passing unit tests alone does not establish an experiment result. There is no build script or active CI workflow. The [CI installation example](ci-checks.example.yml) runs `npm test` and `git diff --check`, not browser tests or experiments.

1. **Prefer the lightest meaningful layer.** Test calculations, branches, and broad input combinations in Node where possible. Reserve Chrome capture/rendering and Docker-backed experiments for behavior and isolation boundaries that require them. Each test should catch a concrete defect rather than mirror implementation details.
2. **Choose combinations deliberately.** Select representative movement, aiming, jumping, recording-validity, and failure cases covering distinct paths. Expand combinations of scenarios, clock/input conditions, browsers, or future model adapters only where interactions warrant it. Preserve required regressions and the contract's scenarios, repetitions, thresholds, fresh browser contexts, and resets; reducing duplicate work must not weaken experiment evidence.
3. **Match validation to the change.** Use the guidance below for fast feedback and applicable pre-merge regression validation. Keep deployment/publication verification possible only after merge separate and pending under the [validation timing rules](review-guidelines.md#check-validation-timing). Additional exploratory checks are optional unless the Issue or applicable contract requires them; do not defer achievable mandatory checks until after merge.
4. **Reuse work and avoid duplicate execution.** Reuse dependency downloads, worker images, and permitted fixture preparation with keys reflecting dependencies, tool versions, and inputs, while preserving isolation and frozen identities. Never reuse consumed final cases or discard their history. Run one experiment at a time as required by the condition. If CI is installed, avoid equivalent push/PR runs for the same revision and cancel superseded validation when safe; preserve necessary deployment ordering. Parallelize independent work only with measured resource use, not an assumption that more workers help.
5. **Review coverage and cost together.** Identify the additional defect each new or expanded check detects, whether existing coverage already provides that assurance, and its execution and maintenance cost. Watch repeated Chrome/container startup, PNG capture and large fixtures, long capture/evaluation loops, and Cartesian-product growth. Retain meaningful assertions when consolidating checks.
6. **Maintain an evidence-based execution-time budget.** Normal-CI timing is currently unmeasured and no target is established. The example's five-minute timeout is a safety limit, not a measured baseline or performance target. During actual test/CI performance work, establish a representative baseline and target, monitor growth, and investigate overruns by revisiting setup, duplication, and validation layers. Track elapsed feedback time, total runner/computation time, and queue time separately. This guidance adds no benchmark, hardware, or merge gate.

Choose applicable checks before merge and report what ran:

| Change | Applicable validation |
| --- | --- |
| Documentation only | Check Markdown structure, links/anchors, command consistency, and `git diff --check`; application tests, browser runs, and experiments are not required solely for prose changes. |
| UI: CLI/messages, playable fixture, or reconstruction | Check affected user-facing behavior and [UI/UX principles](../README.md#uiux); use Node tests for CLI logic and Chrome checks for affected rendered/input behavior. |
| Core/runtime, evaluation, or isolation | Run `npm test` for regression coverage; run `npm run test:browser` for affected capture, browser, or cleanup boundaries, and contract-required experiment validation for changed experiment claims. |
| CI/build/dependency setup | Validate affected configuration and commands, including applicable regression checks; the inactive example is not evidence of an executed workflow. No build command is currently configured. |

The Issue's mandatory pre-merge criteria and applicable experiment requirements still apply. Report optional validation and genuinely post-merge-only verification separately. Changes to tests, triggers, caches, workers, or application behavior belong in separately scoped implementation work.
