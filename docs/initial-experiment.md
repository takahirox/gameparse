# Initial experiment contract

Protocol version: 0.1. Changes require a new preregistration identity.

This contract resolves the design questions in issues
[#2](https://github.com/takahirox/gameparse/issues/2),
[#3](https://github.com/takahirox/gameparse/issues/3),
[#4](https://github.com/takahirox/gameparse/issues/4), and
[#5](https://github.com/takahirox/gameparse/issues/5).
It specifies requirements for a future implementation; publishing this document
does not demonstrate that an isolation mechanism or reconstruction works.

## Scope and decisions

Use a local, single-player 3D fixture with reproducible reset, a static scene,
visible landmarks, a fixed camera projection, and no camera bob or animation
that obscures the first measurements. Test forward/backward and lateral movement,
relative-mouse aiming, and grounded jumping. Multiplayer, combat, arbitrary
exploration, and source recovery are outside this experiment.

Separate three decisions:

1. **Protocol validity:** isolation, preregistration, capture quality, and final-set
   independence satisfy this contract. A violation makes the result invalid for
   a recovery/generalization claim, even if the implementation looks correct.
2. **Experiment completion:** preserve the required artifacts and produce a report
   for every planned scenario, including failures and blocked stages. An abandoned
   pipeline is reported as incomplete. A fully attempted pipeline with a failed
   generator or missing runnable reconstruction can be complete with a failed
   reconstruction outcome; missing required evidence makes it incomplete.
3. **Reconstruction success:** a valid experiment produces a runnable reconstruction
   and all three required behaviors pass on both recorded and final held-out
   scenarios, using the frozen thresholds and repeatability rules. A complete
   experiment may fail or be inconclusive. No weighted average can hide a failed
   behavior or missing scenario.

Report completion, validity, and success separately. Capture failures are not
game failures; missing evidence is not a passing score. Appearance, evidence
quality, unknowns, and unsupported additions each receive their own findings.

## Information boundaries

The experiment coordinator provisions distinct roles and stores. Test-game authors
must not serve as analyzers or generators in a session carrying their source-code
knowledge. The evaluator may know the source and ground truth. The collector is a
restricted executor, not a reasoning channel carrying privileged knowledge into
analysis. Shared parent-agent history also counts as input.

| Role | Allowed inputs | Outputs and restrictions |
| --- | --- | --- |
| Fixture author | Fixture requirements, original source, ground truth | Reference game and evaluator-only truth; neither enters analysis/generation stores |
| Collector | Opaque runnable reference, public reset recipe, assigned input scenarios | Inputs, frames, timestamps, public initial conditions, capture failures; no source maps, DOM scripts, network payloads, or internal telemetry exported |
| Analyzer | Sanitized capture bundle, public requirements, protocol | Evidence-backed specification; no original files, ground truth, final scenarios, or evaluator feedback from final evaluation |
| Generator | Exported specification, explicit public reconstruction requirements, toolchain | Independent implementation and addition log; no raw frames, original code, evaluator-only truth, or final scenarios |
| Evaluator | Reference, reconstruction, ground truth if needed, frozen plan and private final scenarios | Separate public results and private evaluation artifacts; internal measurements never flow back as image-only analysis evidence |

For the initial condition, analysis receives images plus recorded inputs and
capture metadata. DOM/HUD extraction or instrumentation requires a separately
named condition with its own allowlist and report. Generator toolchain/library
access must be declared; browsing the reference game's source or assets is never
allowed. Public requirements can specify the scene and evaluation interface but
must identify any supplied geometry, camera settings, or behavioral constants.
Supplied facts are not counted as recovered facts.

Enforce these boundaries with separate containers or equivalent OS isolation:
mount only allowlisted input files read-only, use private writable output and
temporary directories, and disable network access except explicitly allowlisted
tool services. Do not mount the repository, reference server, host home, shared
agent memory, browser profiles, credentials, or evaluator store. A fresh chat or
working directory alone is insufficient. The analyzer consumes offline captures;
the generator needs no reference-game connection. Capture tooling must prevent
the analyzer from receiving executable page content through its artifacts.

Before each run, retain the sanitized mount/network policy, input manifest, tool
configuration, and session ancestry declaration. Probe that a non-secret sentinel
in the privileged store is inaccessible through filesystem and available tools;
probe blocked network access and shared-history exclusion. Stop before analysis
if the boundary cannot be established. These probes supplement the isolation
policy; sentinel absence alone does not prove isolation. Audit logs and actual
input hashes must match the allowlist. Never publish credentials or private host
content as evidence.

Every specification item has an ID, provenance category (`observation`,
`measurement`, `inference`, or `supplied_requirement`), evidence IDs, method,
conditions, units/coordinate system, and limitations. Inferences reference their
supporting observations or measurements. Unknown parameters stay explicitly
unknown. The generator maps implemented behavior to specification IDs and records
all extra choices as `generator_addition`, including defaults used to fill gaps.
Publish the exact reconstruction requirements alongside the specification.

If privileged information leaks, preserve the violation record and mark that
condition invalid. Restart from clean isolated sessions and a new experiment ID;
do not repair a claim merely by deleting leaked text from the final report.

## Observable equivalence

Fix viewport (initial default 1280 × 720), device scale (1), camera projection,
initial view, reset procedure, and input modality in public requirements. List
each setting's provenance. Use original substitute assets with corresponding
semantic landmarks; geometry/camera settings supplied for comparability must not
be credited as discoveries. Appearance is assessed separately; raw pixel equality
is not a behavior metric. Do not fit geometry, scale, camera, or time alignment
after seeing final results.

Before scored runs, verify that the fixture permits the following measurements
using development-only scenarios. If not, revise and freeze a new protocol before
final evaluation rather than silently changing metrics. Store the landmark
identification method and development calibration evidence.

| Behavior | Observable and comparison | Initial acceptance tolerance |
| --- | --- | --- |
| Movement | Time-indexed corresponding static landmark coordinates, normalized by viewport width/height; include key release and stopping interval | RMS 2D trajectory error ≤ 0.02 viewport units and maximum error ≤ 0.05 |
| Aiming | Same landmark metric during and after relative-mouse input, with initial camera and projection fixed | RMS error ≤ 0.02 and maximum error ≤ 0.05 |
| Jumping | Same landmark metric through ascent/descent, plus visually detectable departure and return to grounded baseline | RMS error ≤ 0.02, maximum error ≤ 0.05, departure/landing timing error each ≤ 50 ms, and airtime error ≤ 50 ms |

These are initial engineering acceptance choices, not measured perceptual
thresholds. They must be accepted or replaced with justified values during
preregistration, before scored runs. All required metrics must pass. Absolute
world-space speed, gravity, and mouse sensitivity in internal units are not
required to match unless identifiability from allowed evidence is established
beforehand. Evaluator-only instrumentation may diagnose parameter error, but
cannot establish that the analyzer observed it or replace these observable tests.

For each scenario preregister at least three non-collinear visible landmarks and
their correspondence/occlusion schedule. Compare all scheduled points, with equal
weight per point and timestamp; RMS is the square root of the mean squared 2D
Euclidean distance. Maximum is over the same distances. Missing points caused by
capture/detector failure make the trial unscorable; absence caused by reconstructed
scene/behavior divergence fails the trial. Uncertain cause is inconclusive, never
a silent exclusion. Camera/scene ambiguity that prevents correspondence makes the
comparison inconclusive and precludes success.

Use a shared monotonic clock per capture session. Save requested input times,
dispatch/acknowledgment times, and frame observation times with uncertainty;
acknowledgment is not proof of in-game consumption. Align reference and candidate
at the first dispatched input relative to reset completion, not at an observed
response. Compare at the reference sample times using linear interpolation only
between valid bracketing candidate frames. No extrapolation or dynamic time warp.
Capture the pre-input baseline and the full preregistered post-release interval.
Record capture overhead separately from inferred response delay.

Initial capture gates: target 60 frames/s; no bracketing gap above 50 ms; combined
timestamp/alignment uncertainty at most 10 ms; absolute dispatch-time deviation
from the prescribed input schedule at most 10 ms for every event. A gate failure
is a collection failure, not a behavior score. Record clock calibration, gaps,
dropped frames, and scheduling deviation. If tooling cannot meet these gates,
report the blocker or preregister a distinct condition; do not claim compliance.

Define the jump event detector before scoring: departure is the first sample
where the declared vertical landmark displacement exceeds 0.005 normalized height
for at least two consecutive frames; landing is the first return within 0.005
of baseline sustained for at least 100 ms after ascent. Use stationary jumping
for this event metric; combined movement+jump tests still use trajectory metrics
and require a preregistered independent visual ground-contact detector if event
timing is scored. Record detector uncertainty; ambiguous events are inconclusive.

## Repetitions and failures

Run five valid reference/candidate pairs per scenario from reset. Each scenario
passes only if at least four of five pairs pass every required metric. Report all
five scores, range and median; this is an engineering repeatability rule, not a
population-level statistical guarantee. All scenarios must pass independently.

Allow at most seven attempts to obtain five valid pairs. Retries are permitted
only for documented capture/infrastructure failure, never for a valid bad behavior
score. Retain every attempt and failure reason. Fewer than five valid pairs is
inconclusive. No automatic model fallback, usage-limit reset, allowance purchase,
or unbounded retry is permitted. A usage limit stops dependent actions and is
reported while preserving safe progress.

## Development and final evaluation lifecycle

1. Preregister requirements, protocol, metrics, thresholds, capture gates,
   repetitions, retry policy, scenario families/ranges, and splitting method.
   Ground truth and exact final cases remain in a private evaluator store.
2. Capture analysis cases. Development evaluation can inform iteration; record
   each specification/implementation version and feedback supplied to each role.
3. Before final evaluation, freeze and SHA-256 hash the protocol, public
   requirements, capture/analysis inputs, specification, generator inputs, model
   and tool configuration, implementation source/build, dependency lockfiles,
   evaluator/detector versions, and the private final-case manifest. Record an
   immutable manifest and timestamp. Keep executable artifacts as well as hashes.
4. The evaluator runs recorded and final cases independently. Final cases must
   contain both unseen input durations and unseen combinations within declared
   families. For this first experiment require at least two recorded scenarios
   per behavior, one unseen-duration case per behavior, and two unseen-combination
   cases overall. Preregister exact counts, sampling ranges and scoring obligations
   for each combination. Reject duplicates of analysis/development cases. Do not
   expose final cases, reference final captures, or interim final results to the
   analyzer/generator. An opaque pass/fail is also feedback.
5. Publish results only after every scheduled final attempt has terminated or a
   blocker has been recorded. Report recorded and final results separately and
   retain failures. Final cases may then be released for audit, labeled consumed.
6. Once any final result is used to revise a specification, requirements, detector,
   evaluator, or implementation, that set becomes development evidence. A new
   final claim requires a new preregistration and an independently selected unseen
   set from the declared scenario space, with fresh freeze records. A rerun of
   the disclosed set is a regression result, not independent generalization.

Infrastructure reruns can retain the original freeze only when no implementation,
inputs, scoring code, protocol, or environment identity changes and the frozen
retry policy permits another attempt. Log their reason and disclose results seen
by humans/agents. An environment change requires a new freeze; results already
used for tuning cannot become held-out again. If the finite case space is exhausted,
report that independent generalization is unavailable rather than relabeling cases.

## Required evidence and next implementation work

Use the [preregistration](templates/preregistration.md) and
[report](templates/experiment-report.md) templates. Preserve raw captures, input
events, resets, timing metadata, provenance, exact stage inputs/outputs, isolation
audits, frozen manifests, scores, and failure/addition logs with stable artifact
IDs and hashes. Public manifests reference private evaluator artifacts by opaque
ID and digest; publish contents only after final evaluation where appropriate.

The next implementation must supply the fixture/reset harness, isolated stage
runners, capture and clock-quality checks, specification exporter, reconstruction
runner, landmark/event evaluator, and artifact/report writer. Verify denied
privileged access and deliberate capture/behavior failures before a scored run.
Always terminate owned browsers and servers after completion, failure, or
cancellation, and record cleanup outcomes. This protocol's design issues can close
on documentation review; the vision's experimental acceptance boxes stay open
until executable evidence satisfies them.
