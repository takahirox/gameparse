export function validateScenario(scenario) {
  if (
    !Number.isInteger(scenario.duration) ||
    scenario.duration < 16 ||
    scenario.duration > 60000 ||
    scenario.duration % 16
  )
    throw new Error("Invalid scenario duration");
  if (!Array.isArray(scenario.events) || !scenario.events.length)
    throw new Error("Scenario needs input events");
  let previous = -1;
  for (const event of scenario.events) {
    if (
      !Number.isInteger(event.at) ||
      event.at < 0 ||
      event.at > scenario.duration ||
      event.at % 16 ||
      event.at < previous
    )
      throw new Error("Invalid input timing");
    if (!["down", "up", "mouse"].includes(event.type))
      throw new Error("Invalid input type");
    if (
      event.type === "mouse"
        ? !Number.isFinite(event.dx) || !Number.isFinite(event.dy)
        : !["w", "a", "s", "d", "Space"].includes(event.key)
    )
      throw new Error("Invalid input value");
    previous = event.at;
  }
}

export function validateRecording(recording) {
  validateScenario(recording.scenario);
  if (!recording.captureValid || !recording.cleanup)
    throw new Error("Invalid capture or cleanup");
  if (
    recording.condition !== "controlled-clock-image-only-v1" ||
    recording.clock?.stepMs !== 16 ||
    recording.clock?.wallTimeClaim !== false
  )
    throw new Error("Capture condition mismatch");
  if (
    recording.pointerLock !== false ||
    recording.inputModality !== "left-button drag; no pointer lock"
  )
    throw new Error("Input modality mismatch");
  if (
    !Array.isArray(recording.inputs) ||
    recording.inputs.length !== recording.scenario.events.length
  )
    throw new Error("Missing input evidence");
  for (let i = 0; i < recording.inputs.length; i++) {
    const actual = recording.inputs[i],
      expected = recording.scenario.events[i];
    for (const [key, value] of Object.entries(expected))
      if (actual[key] !== value) throw new Error("Input evidence mismatch");
    validateInputReceipt(expected, actual.received);
    if (
      actual.dispatchTime !== expected.at ||
      actual.acknowledgmentTime !== expected.at ||
      !Number.isFinite(actual.wallRoundTripMs) ||
      actual.wallRoundTripMs < 0
    )
      throw new Error("Input clock mismatch");
  }
  if (recording.frames.length !== recording.scenario.duration / 16 + 1)
    throw new Error("Incomplete frame sequence");
  for (let i = 0; i < recording.frames.length; i++) {
    const frame = recording.frames[i];
    if (
      frame.time !== i * 16 ||
      !/^frame-\d{5}\.png$/.test(frame.file) ||
      !/^[a-f0-9]{64}$/.test(frame.sha256)
    )
      throw new Error("Invalid frame evidence");
  }
}

export function validateInputReceipt(expected, received) {
  if (!Array.isArray(received) || received.length !== 1)
    throw new Error("Missing or unexpected DOM input receipt");
  const actual = received[0];
  const type = { down: "keydown", up: "keyup", mouse: "mousemove" }[
    expected.type
  ];
  if (
    actual.type !== type ||
    actual.trusted !== true ||
    actual.virtualTime !== expected.at
  )
    throw new Error("DOM input receipt mismatch");
  if (expected.type === "mouse") {
    if (
      actual.dx !== expected.dx ||
      actual.dy !== expected.dy ||
      !(actual.buttons & 1)
    )
      throw new Error("Relative mouse delivery mismatch");
  } else if (
    actual.code !==
    (expected.key === "Space" ? "Space" : `Key${expected.key.toUpperCase()}`)
  )
    throw new Error("Key delivery mismatch");
}
