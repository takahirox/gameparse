## Summary

Describe what changed.

## Outcome

Describe what changes as a result, including before/after behavior when useful.

## Validation

Describe how the change was validated.

Separate completed mandatory pre-merge checks and their evidence from genuinely required post-merge-only checks. Mark the latter pending until performed, or state that none are required; report unperformed or environment-blocked checks honestly. Use the [validation guidance](https://github.com/takahirox/gameparse/blob/main/docs/development-flow.md#testing-and-ci-principles) to match checks to the change.

After merge and Issue closure, record actual results in this PR, the closed Issue, or a linked report under the [post-merge lifecycle](https://github.com/takahirox/gameparse/blob/main/docs/development-flow.md#6-perform-post-merge-verification). Follow that guidance for actual defects and new linked Issues.

## Related issues

Use `Closes #N` when the Issue is fully implemented and applicable mandatory pre-merge acceptance is satisfied; retain it when only post-merge verification is pending. For intentional partial work, use `Refs #N` and state the remaining scope without automatically closing the parent Issue. See the [review timing rules](https://github.com/takahirox/gameparse/blob/main/docs/review-guidelines.md#check-validation-timing).
