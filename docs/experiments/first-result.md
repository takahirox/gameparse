# First controlled-clock reconstruction result

Run: `controlled-drag-final-1`. Completion: **complete**. Protocol validity within the declared condition: **valid**. Reconstruction: **success**.

This is a model-based, known-geometry, controlled-clock/drag baseline. It is not evidence of real-time capture, pointer-lock fidelity, arbitrary-game discovery, or blind selection of a dynamics model. See the [condition declaration](controlled-clock.md).

## Behavioral evidence

120 evaluation captures retain 8220 PNG frames. Each of 12 scenarios has five reference reset runs and five candidate runs. All reference-only stability comparisons passed. The five reference runs are reused as paired references, as preregistered. The tolerance is RMS ≤ 0.02 and maximum ≤ 0.05 in normalized viewport coordinates; jump event error tolerance is 50 ms. Maximum observed jump event error: 16 ms.

| Group | Scenario | Passing pairs | Largest RMS | Largest point error | Decision |
| --- | --- | --- | --- | --- | --- |
| recorded | move-forward | 5/5 | 0.000161 | 0.001389 | success |
| recorded | move-right | 5/5 | 0.000418 | 0.000781 | success |
| recorded | aim-horizontal | 5/5 | 0.000936 | 0.001563 | success |
| recorded | aim-vertical | 5/5 | 0.001663 | 0.002778 | success |
| recorded | jump-short | 5/5 | 0.000958 | 0.002778 | success |
| recorded | jump-long | 5/5 | 0.000958 | 0.002778 | success |
| recorded | move-diagonal | 5/5 | 0.000343 | 0.000781 | success |
| final-held-out | held-movement | 5/5 | 0.000102 | 0.001389 | success |
| final-held-out | held-aim | 5/5 | 0.001705 | 0.002344 | success |
| final-held-out | held-jump | 5/5 | 0.000958 | 0.002778 | success |
| final-held-out | held-diagonal | 5/5 | 0.000458 | 0.000781 | success |
| final-held-out | held-move-aim | 5/5 | 0.000490 | 0.001389 | success |

## Inference diagnostics

The following ground truth is evaluator-only, reported from the reference implementation for evaluation. It was not included in either worker's inputs. Matching these private parameters is diagnostic, not the acceptance metric; known camera/landmark scale is a supplied requirement.

| Parameter | Image-based estimate | Evaluator-only truth | Relative error |
| --- | --- | --- | --- |
| movementRate | 3.246529 | 3.2 | 1.45% |
| mouseRadiansPerPixel | 0.002441 | 0.0025 | 2.37% |
| jumpImpulse | 5.358458 | 5.4 | 0.77% |
| gravity | 10.791179 | 10.8 | 0.08% |

## Boundaries, additions and failures

Analysis ran with PNG/input captures and public requirements in a network-disabled Docker container. Generation ran separately with only specification.json as its data input; no original source, raw images, measurement traces or prior conversation were supplied. Tool code and container image identities are retained. The tools use a preselected constant-rate/ballistic model family authored alongside the fixture; this prior knowledge is explicitly not a discovery.

The generator additions are background/grid/crosshair styling, a pitch clamp, repeat-jump behavior for long holds, and omitted collision geometry. Tests do not establish those unobserved mechanics. Appearance differs intentionally and is not given a fidelity score. Parameter estimation errors above remain errors despite passing behavioral tolerances.

Preflight pointer-lock failures are retained in artifacts/capture-smoke-1 and capture-smoke-2. The declared drag smoke check passed. The development experiment passed but its final cases were consumed. This final run excluded those cases. This final evaluation had 0 collection failures/retries; all attempts are recorded in report.json. Browser/server cleanup: true; worker cleanup is documented in the audits. Graceful cancellation was separately exercised by the browser integration tests.

## Reviewable artifacts

- [Full report](evidence/controlled-drag-final-1/report.json), [specification](evidence/controlled-drag-final-1/specification.json), [preregistration](evidence/controlled-drag-final-1/preregistration.json).
- [Freeze manifest](evidence/controlled-drag-final-1/freeze.json), [evaluation frame manifest](evidence/controlled-drag-final-1/evaluation-manifest.json), [consumed final cases](evidence/controlled-drag-final-1/private-final.json).
- [Analysis audit](evidence/controlled-drag-final-1/analyze-audit.json), [generation audit](evidence/controlled-drag-final-1/generate-audit.json).
- [Reference sample](evidence/controlled-drag-final-1/reference.png), [reconstruction sample](evidence/controlled-drag-final-1/candidate.png).
- [Playable reconstruction](../../examples/controlled-clock-reconstruction/index.html): run `node src/cli.mjs serve --dir examples/controlled-clock-reconstruction` and open the printed localhost address.

All raw captures, measurements and exact worker inputs remain locally in `artifacts/controlled-drag-final-1/`; only the manifests, report and two sample images are committed. The public subset cannot independently reproduce every score without those raw artifacts. The executable pipeline can generate a new experiment; preserve the consumed-case ledger and do not claim independence by deleting history.

Freeze SHA-256: `f5f3fe4585b80cce844ed95f590beefa73430c7bc875770602c67d60d67cc199`.

Implementation commit for the scored run: `cd51a4e`. Later report-only changes do not alter its frozen executable artifacts. Validation includes 14 unit/negative tests and 2 real-Chrome integration tests. GitHub CI was not enabled because the OAuth credential cannot write workflows; docs/ci-checks.example.yml is an inactive installation example.
