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

Record required checks possible only after merge separately, or state that none are required. These checks must not be prerequisites for pre-merge PR approval. Report each as pending until performed; do not claim unperformed checks passed.

For a merge-triggered deployment, verify successful publication and the newly published site after merge. This separation does not waive implementation requirements or applicable pre-merge tests. See the [review guidelines](https://github.com/takahirox/gameparse/blob/main/docs/review-guidelines.md#check-validation-timing).

## Context

Add any relevant context, examples, logs, or related issues.
