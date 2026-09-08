# Controlled-clock image-only baseline

Condition ID: `controlled-clock-image-only-v1`.

This is a distinct intervention condition under the initial protocol. It is not
evidence that real-time capture meets the original 60 fps / 10 ms wall-clock gates.
Playwright [Clock](https://playwright.dev/docs/clock) controls page timers,
`performance`, and animation callbacks. The collector advances 16 ms, dispatches
scheduled inputs, and records a PNG before advancing again. Virtual time and
wall-clock capture/input round-trip durations are recorded separately. Virtual
sampling is 62.5 Hz; screenshots may take longer in real time without advancing
the game. No engine state, pose telemetry, or source is supplied to the analyzer.
An input-only page listener records trusted DOM key/mouse receipts on that clock,
including actual relative mouse deltas; these must match prescribed inputs.
DOM receipt is evidence of delivery, not proof of in-game consumption. Screenshots
and input acknowledgments are checked against the frozen virtual clock.

The capture modality is left-button dragging with relative mouse events and no
pointer lock. macOS Chrome rejected pointer lock in our preflight checks, including
a displayed browser; the same error is documented in
[Playwright #20956](https://github.com/microsoft/playwright/issues/20956).
The game supports optional manual pointer lock, but that path is not evaluated.
The click/drag setup, reset and initial mouse position are declared initial
conditions, not recovered behavior.

## What this experiment can establish

The fixture is a perspective-projected 3D landmark course, rendered with Canvas
2D from 3D coordinates. It has planar movement, relative view rotation and a
ballistic jump. Scene geometry, camera projection, landmark colors and initial
pose are supplied reconstruction requirements, so they are not discoveries.

The analyzer is a deterministic model-fitting program, and the generator is a
deterministic model-based code generator. Their tool source is authored alongside
the fixture, with an explicit constant-rate/ballistic hypothesis family. This is
not a blind test of model-family discovery or a general-purpose LLM game agent.
Neither worker receives reference source or private parameter values at execution.
The generator receives only the exported specification; it does not receive PNGs,
measurement traces, or reference files. A fresh OS process in a network-disabled
container has no conversational history. No external model service or allowance
is used.

The analyzer locates exact-color landmarks in PNGs, estimates camera pose by
least-squares perspective fitting, then estimates movement rate, mouse response,
jump impulse and vertical acceleration. The known scene scale makes these values
identifiable only in the supplied coordinate system. Comparing single-axis and
diagonal observations tests the normalized constant-rate hypothesis. Claims link
to capture IDs and image hashes through the retained measurements. Pixel
quantization, finite sampling and model-family assumptions remain limitations.

## Evaluation and evidence

Preregistered numeric tolerances and repetition rules use the original contract.
All four landmarks must remain visible for the entire fixed observation window.
There is no post-result time warping or camera fitting in evaluation: corresponding
landmark coordinates are compared directly on the shared virtual sampling grid.
The five reference stability recordings may also serve as the five paired reference
trials; each candidate trial has its own fresh browser context and reset.

Seven observation scenarios cover movement, aiming and jumping. Five private final
scenarios test new durations/temporal spacing and two unseen input combinations.
Case generation and its declared ranges live only in the coordinator/evaluator;
the source file is not mounted into either worker. Case contents are sampled and
hashed after generation, before scoring. Final feedback is not supplied to the
workers. Once reported, these cases are consumed.

The runner scans previously frozen case files under `artifacts/` and excludes
their exact input sequences, including runs that did not finish. A new seed is
not sufficient. Do not delete or move that history to obtain a new final claim.
The finite case pools eventually exhaust; the runner then stops and requires a
new preregistered condition. Separate installations must carry the consumed-case
history forward. Concurrent experiments in the same workspace are unsupported.

`artifacts/<id>/` retains preregistration, input/frame recordings, measurements,
specification, worker input/tool/output manifests, boundary probes, reconstruction,
private cases, immutable freeze metadata, individual trial scores and a report.
Failed preflight runs are kept under their own IDs. Raw artifacts are ignored by
Git to avoid repeatedly committing thousands of PNGs; the experiment report must
state their retained location and the limits of any published evidence subset.

The final freeze covers coordinator/evaluator source, worker tools, the fixture,
protocol and condition documents, dependency lockfile, exact stage inputs/outputs,
audit records, plan and final cases. All identities are rechecked after scoring.
Cancellation preserves an incomplete report and terminates owned browser contexts,
servers and worker containers; it never retries a cancelled trial. Collected game
runtime exceptions are behavior failures for the candidate and invalid reference
evidence for the reference, separately from collection failures.

The fixed protocol is implemented incrementally. A result must state unsupported
conditions and any deviations explicitly; passing unit tests is not a recovery
result. The vision remains open for real-time capture, pointer-lock validation,
broader games and interchangeable agent/model adapters.
