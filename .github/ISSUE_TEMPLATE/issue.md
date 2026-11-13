---
name: Issue
about: Report a problem or propose a change
title: ""
labels: ""
assignees: ""
---

## Problem

Describe the problem.

## Expected outcome

Describe what should be true when the issue is resolved.

Default to completion criteria an AI agent can execute and verify. Require human checks only when necessary; explain why and the expected result, and distinguish optional validation from mandatory criteria. See the [development guidance](https://github.com/takahirox/gameparse/blob/main/docs/development-flow.md#1-start-with-an-issue).

## Pre-merge acceptance criteria

List mandatory acceptance criteria that are achievable and verifiable before merge, including implementation requirements and applicable pre-merge tests.

For a merge-triggered deployment, validate the code and configuration, local builds, and applicable automated tests before merge.

## Post-merge verification

Record checks possible only after merge that the actual change requires, or state that none are required. Their pending status must not block pre-merge PR approval or closure of a fully implemented Issue after successful merge. Report each as pending until performed; do not claim unperformed or environment-blocked checks passed.

For a merge-triggered deployment, verify successful publication and the newly published site after merge. Follow the [merge/closure and evidence lifecycle](https://github.com/takahirox/gameparse/blob/main/docs/development-flow.md#5-merge), including new linked Issues for actual defects. Documentation-only changes do not need deployment or model runs solely for prose edits.

## Context

Add any relevant context, examples, logs, or related issues.

For a defect found after merge, check for an existing equivalent Issue first. Include reproduction steps, affected revision, expected/actual behavior, and links to the original Issue and PR. An unavailable test environment alone is not a product defect.
