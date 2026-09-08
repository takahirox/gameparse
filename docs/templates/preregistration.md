# Experiment preregistration

Status: DRAFT — all placeholders must be resolved before scored runs.

- Experiment ID, protocol version/hash, owner, frozen timestamp:
- Observation condition and claim being tested:
- Public requirements and provenance of supplied facts:
- Fixture identity (private), reset recipe, public camera/viewport conditions:
- Role environments, mount/tool/network allowlists, session ancestry:
- Boundary probe procedure and audit artifact IDs:
- Analysis/development cases and input schedule artifacts:
- Private final manifest ID/hash; sampling method, ranges, exclusions, counts:
- Recorded/final movement, aiming, jumping and combination coverage:
- Landmark IDs/correspondence/visibility schedules and calibration evidence:
- Event detector definition, version, calibration and uncertainty:
- Required metrics per scenario, units, aggregation and tolerances:
- Clock alignment, sampling, quality gates and overhead measurement:
- Repetition count, pass rule, attempt cap and retry eligibility:
- Policy for missing observations, ambiguity and pipeline failure:
- Appearance assessment method and separate reporting:
- Unknowns, additions and identifiable parameter claims:
- Models/settings, tools, dependency versions and usage-limit stop policy:
- Immutable artifact store and sanitized public/private access policy:
- Cleanup and cancellation procedure:

## Final freeze manifest

Record artifact ID, SHA-256, storage location/access role, and creation time for
each required artifact in the contract. Never put private case contents, secrets,
or privileged ground truth in public generator/analyzer inputs.

| Artifact | ID | SHA-256 | Access role | Creation time |
| --- | --- | --- | --- | --- |
| Protocol and preregistration | | | | |
| Public requirements | | | | |
| Allowed stage inputs and captures | | | | |
| Specification and provenance | | | | |
| Exact generator inputs and configuration | | | | |
| Implementation source, build and dependencies | | | | |
| Evaluator, detector and execution environment | | | | |
| Private reference and ground truth | | | | |
| Private final-case manifest | | | | |

Freeze attestation: all entries resolved, boundaries verified, final feedback not
disclosed, no further tuning before this final evaluation.
