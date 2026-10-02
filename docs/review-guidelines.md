# Review Guidelines

The purpose of review is not only to check whether a change works. It is also to verify that the change is the right response to the Issue that motivated it.

These guidelines are particularly important when reviewing AI-generated changes.

## Review Against the Issue

Start by reading the source Issue.

Treat the Issue as the reference for the intended problem and expected outcome.

Ask:

> Is the Pull Request a complete and appropriately scoped solution to this Issue?

## Check for Missing Work

Verify that the Pull Request addresses all parts of the Issue that it claims to resolve.

Do not approve a Pull Request as closing an Issue when important requirements remain unimplemented.

If the change is intentionally partial, the Pull Request should say so and the Issue should remain open.

Required post-merge verification recorded as pending is separate from missing implementation. Do not treat it as partial implementation or claim the outcome is fully verified before those checks are performed.

## Check for Unnecessary Work

Verify that the Pull Request does not go beyond what the Issue requires without a clear reason.

Watch for:

- unnecessary abstractions
- speculative extensibility
- unrelated refactoring
- new frameworks or subsystems that are not required
- additional policies or configuration with no demonstrated need

AI agents can over-engineer solutions. Do not treat additional complexity as automatically beneficial.

Prefer the smallest design that completely solves the stated problem.

## Check the Result

Also verify the ordinary quality of the change:

- behavior matches the expected outcome
- implementation is coherent with the existing architecture
- validation is sufficient for the change
- documentation is updated when the change affects documented behavior

## Check Validation Timing

Follow the [development flow](development-flow.md#1-start-with-an-issue): mandatory pre-merge acceptance criteria must be achievable and verifiable before merge. Checks possible only after merge must not be prerequisites for pre-merge PR approval.

For example, for a merge-triggered deployment, review the code and configuration, local builds, and applicable automated tests before merge. Verify successful publication and the newly published site after merge.

Ensure required post-merge verification is recorded separately in the Issue and Pull Request and reported as pending until performed. Review the actual pre-merge validation evidence; this separation does not waive implementation requirements or applicable pre-merge tests. Do not accept claims that unperformed checks passed.

## Review Outcome

A Pull Request is ready to merge when:

- it fully addresses the Issue it claims to resolve
- it does not introduce unjustified scope or complexity
- the implementation is correct and appropriately validated
- mandatory pre-merge acceptance criteria are satisfied, and required post-merge verification is recorded separately as pending until performed

If any of these conditions are not met, request changes and review again after revision.

Required post-merge checks may remain pending at approval. After merge, record their actual results and evidence as described in the [post-merge verification step](development-flow.md#6-perform-post-merge-verification).
