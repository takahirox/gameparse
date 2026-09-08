# Gameparse

Gameparse aims to recover reconstructable specifications from observations of
browser-game appearance, controls, and behavior over time.

The repository includes a playable local 3D fixture, browser input/PNG capture,
container-isolated model fitting and reconstruction, and repeated landmark-based
evaluation. The initial runner uses a controlled browser clock and drag aiming;
it does not establish real-time or pointer-lock fidelity.

Requires Node.js 22+, npm, Google Chrome, and Docker for isolated workers.

```sh
npm ci --ignore-scripts
docker pull node:24-alpine
npm test
npm run test:browser
npm run serve
# Open http://127.0.0.1:4173; drag to aim, WASD to move, Space to jump, R to reset.
```

```sh
node src/cli.mjs smoke --id my-capture-check
node src/cli.mjs experiment --id my-experiment
node src/cli.mjs serve --dir artifacts/my-experiment/reconstruction
```

Each ID must be new. Experiments retain raw frames and evidence under
`artifacts/<id>/`; allow several minutes and local disk space for thousands of
PNGs. Docker workers have no network or reference-repository mount. Their image
is resolved to an immutable local ID and recorded; missing images cause an error,
not an automatic download or model fallback.

Keep previous experiment directories: their frozen final-case files prevent reuse
of consumed evaluation data. Run one experiment at a time. Ctrl-C preserves a
partial report and cleans up owned resources. The CI configuration is provided as
[an installation example](docs/ci-checks.example.yml); CI is not enabled because
the current GitHub credential cannot add workflows.

- [Vision](https://github.com/takahirox/gameparse/issues/1)
- [Initial experiment contract](docs/initial-experiment.md)
- [Preregistration template](docs/templates/preregistration.md)
- [Experiment report template](docs/templates/experiment-report.md)
- [Controlled-clock condition and limitations](docs/experiments/controlled-clock.md)

Implementations must satisfy the protocol's isolation and evaluation gates
before their results can be counted as an experiment under this contract.
