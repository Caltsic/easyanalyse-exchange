# EASYAnalyse Layout and Signal Analysis Guide

Use this reference when the task is not only to make JSON valid, but also to make it spatially readable, semantically useful, and analysis-friendly.

This guide covers:

- canvas sizing
- component abstraction and sizing
- placement strategy
- port placement conventions
- node usage
- wire routing heuristics
- signal annotation strategy
- signal tracing workflow

## 1. Canvas sizing

The canvas is a finite 2D workspace. Pick dimensions that fit all components with breathing room.

Suggested defaults:

| Circuit scale | Typical canvas | Typical grid |
|---|---|---|
| Single component demo | 800 x 600 | 20 |
| Small circuit (2-6 components) | 1600 x 900 | 40 |
| Medium circuit (7-20 components) | 2400 x 1600 | 40 |
| Complex subsystem | 3200 x 2400 | 40 |
| Full system block diagram | 4800 x 3200 | 80 |

Rules:

- leave at least one grid cell of margin between components and the canvas edge
- leave at least 80 px of horizontal or vertical space between adjacent components for routing
- place component origins on grid multiples when possible

When uncertain, default to:

- canvas: `2400 x 1600`
- grid: `40`

## 2. Component abstraction

Any physical or logical thing can be a component. The shape is an abstract bounding geometry, not a literal schematic symbol.

Soft conventions:

| Shape | Typical use |
|---|---|
| Rectangle | IC, MCU, module, subsystem, power supply, sensor |
| Circle | Passive, test point, connector pad, ferrite bead |
| Triangle | Driver, comparator, transistor, amplifier, directional block |

These are conventions, not hard rules. Choose the geometry that best communicates conceptual weight and port count.

## 3. Component sizing

Component size should scale with:

- conceptual complexity
- abstraction level
- number of ports
- expected routing density around the component

Suggested rectangle sizes:

| Component type | Suggested width | Suggested height |
|---|---|---|
| Simple IC | 100-160 | 80-120 |
| Medium IC | 160-240 | 120-180 |
| Complex IC / MCU | 240-400 | 200-360 |
| Module / dev board | 300-500 | 200-400 |
| Subsystem block | 400-700 | 300-500 |
| Full board / system | 500-900 | 400-700 |

Suggested circle radii:

| Component type | Suggested radius |
|---|---|
| 2-pin passive | 24-40 |
| Test point / pad | 12-20 |
| Connector pin | 20-32 |

Suggested triangle bounding sizes:

| Component type | Suggested size |
|---|---|
| Single transistor / driver | 60 x 60 |
| Comparator / op-amp | 80 x 80 |
| Directional indicator | 40 x 40 |

Heuristics:

- if a component needs more than about 4-6 ports, prefer a rectangle
- leave at least 40 px between adjacent ports on the same side
- increase width or height instead of crowding ports

## 4. Placement strategy

Arrange components to reflect signal flow and reduce crossings.

Common patterns:

- left-to-right flow: source -> processing -> driver -> load
- top-down hierarchy: controller on top, peripherals below
- hub-and-spoke: controller in the center, peripherals around it
- left power rail: supplies on the left, loads to the right

Useful defaults for a 40 px grid:

- simple component gaps: 200-280 px
- complex component gaps: 360-480 px

## 5. Port placement conventions

For rectangles, side choice should help users read intent:

| Side | Typical signals |
|---|---|
| Left | Inputs, incoming control, upstream data |
| Right | Outputs, drive signals, downstream data |
| Top | Supply rails |
| Bottom | Ground, return, reference |

For multiple ports on one side, distribute offsets evenly:

- 1 port: `0.5`
- 2 ports: about `0.33`, `0.67`
- 3 ports: `0.25`, `0.5`, `0.75`
- 4 ports: `0.2`, `0.4`, `0.6`, `0.8`

For circles:

- common 2-pin passive: use `180` for left and `0` for right

For triangles:

- place input on the broad side
- place output near the apex
- keep the chosen edge assignment consistent across similar components in the same drawing

## 6. Computing absolute port positions

Persist anchors, not free coordinates.

When route planning requires world positions, derive them from geometry plus anchor:

- rectangle: use side plus normalized offset
- circle: use `cx`, `cy`, `radius`, `angleDeg`
- triangle: interpolate between edge start and edge end vertices

Use these derived positions only for planning. Do not persist them as port coordinates.

## 7. When to use nodes

Nodes are true topology junctions, not cosmetic bends.

Use a node for:

- fan-out
- fan-in
- T-junctions
- explicit branch points

Do not use a node just to draw a corner in a single wire. Use polyline `bendPoints` for cosmetic corners.

Place nodes on grid-aligned coordinates whenever possible.

## 8. Wire routing heuristics

Prefer orthogonal routing unless a straight diagonal is clearly better.

Defaults:

- use `straight` only when endpoints are already axis-aligned or the diagram intentionally uses diagonals
- otherwise use `polyline`
- for an L-route, a common bend point is `(target.x, source.y)` or `(source.x, target.y)`
- use extra detour bends when direct orthogonal routing would visually cut through another component

Routing ownership:

- `auto`: local tool owns geometry and may rewrite the route
- `manual`: preserve the user-chosen bend points

If the user cares about exact visible geometry, use `manual`.
If the route is just a readable default path, prefer `auto`.

## 9. Wire naming

`serialNumber` is a semantic label, not only a counter.

Prefer meaningful names:

- `VCC`
- `VDD_3V3`
- `GND`
- `SPI_MOSI`
- `I2C_SDA`
- `UART_TX`
- `EN`
- `PWM_CH1`

Fallback numbered names like `W1`, `W2`, `W3` are acceptable when intent is unknown.

## 10. Annotation strategy

Use annotations as the main way to answer "what signal is here?"

Kinds:

- `signal`: electrical value, waveform, logic state, current, impedance
- `note`: explanation, reasoning, configuration, design intent
- `label`: short identifier, net name, tag

Best practices:

- annotate the actual target port or wire
- include units
- include waveform type or logic behavior when relevant
- add a `note` when the result depends on calculation or assumptions

Good signal texts:

- `5V DC, max 2A`
- `3.3V logic UART 115200 baud`
- `PWM 0-3.3V, 20kHz, 50% duty`
- `Hi-Z, pulled up to 3.3V via 10k`

## 11. Signal tracing workflow

When asked what signal appears on a port or wire:

1. identify the driving source
2. trace through intermediate components
3. apply obvious transformations:
   - regulator: fixed output within operating range
   - divider: scale the voltage
   - ferrite bead: DC mostly passes, HF noise reduces
   - capacitor: blocks DC, passes AC
   - MCU GPIO: depends on configured state and supply voltage
   - open-drain: depends on pull-up when released
4. state assumptions explicitly when information is missing
5. annotate the target with a `signal`
6. add a `note` if the reasoning is non-trivial

If the result cannot be determined exactly, say so and present conditional outcomes.

## 12. Multi-level abstraction

This format supports mixed abstraction in one diagram.

Examples:

- a full board as a large rectangle
- an MCU as a medium rectangle
- a bypass capacitor as a small circle
- a transistor or driver as a triangle

Make abstraction clear through:

- `name`
- `description`
- `tags`
- relative size
- placement context

## 13. Quick synthesis checklist

When generating a new document from scratch:

1. choose canvas size
2. choose abstraction level for each component
3. choose geometry and size for each component
4. place components according to signal flow
5. assign ports with readable side conventions
6. add nodes only for true junctions
7. route wires with readable paths
8. give important wires meaningful serial numbers
9. add signal and note annotations where analysis matters
10. verify contract invariants and save blockers
