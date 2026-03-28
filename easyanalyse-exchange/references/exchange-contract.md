# EASYAnalyse Exchange Contract

This reference captures the persisted exchange rules that an AI must follow when generating, repairing, or editing EASYAnalyse circuit JSON.

Use this file as the default contract source when the local project files are unavailable.

If the user is working inside the real EASYAnalyse repository, prefer checking the current runtime schema and validation code to detect drift.

## 1. Top-level shape

Persisted documents are a single JSON object with:

- `schemaVersion`
- `document`
- `canvas`
- `components`
- `ports`
- `nodes`
- `wires`
- `annotations`
- optional `extensions`

The normalized format keeps `components`, `ports`, `nodes`, `wires`, and `annotations` as top-level arrays.

Do not:

- nest `ports` under `components`
- store free wire endpoints instead of references
- target `document` or `annotation` from an annotation

## 2. Naming and serialization

Use camelCase exactly.

Important field names:

- `schemaVersion`
- `createdAt`
- `updatedAt`
- `componentId`
- `pinInfo`
- `connectedWireIds`
- `serialNumber`
- `entityType`
- `refId`
- `angleDeg`
- `edgeIndex`
- `bendPoints`

Do not invent snake_case aliases.

## 3. Document

Rules:

- `document.id` must be globally unique across the whole file.
- `document.title` must be non-empty in persisted output.
- `document.source` is typically `human`, `ai`, `mixed`, or `imported`.
- `document.updatedAt` is tool-owned at normalization/save time.

## 4. Canvas

Rules:

- `units` is currently `px`.
- coordinates are treated as absolute canvas-space coordinates.

## 5. Components

Supported geometry kinds:

- `rectangle`
- `circle`
- `triangle`

Rules:

- component `name` must be non-empty in persisted output
- `geometry` is the authoritative persisted placement
- rotation is persisted only through `extensions.easyanalyse.rotationDeg`
- missing `rotationDeg` means `0`

Do not invent fields like:

- `rotation`
- `angle`
- `rotationRadians`

## 6. Ports

Rules:

- `componentId` must reference an existing component
- port `name` must be non-empty in persisted output
- persisted port position is encoded through `anchor`, not free `x/y`
- anchor kind must match the owning component geometry
- rendered port position is derived from `component.geometry + anchor + component rotation`

Supported anchor kinds:

- rectangle: `rectangle-side` with `side` and normalized `offset`
- circle: `circle-angle` with `angleDeg`
- triangle: `triangle-edge` with `edgeIndex` and normalized `offset`

## 7. Nodes

Rules:

- `connectedWireIds` is required in persisted JSON
- `connectedWireIds` must exactly match the wires that reference the node
- persisted nodes require at least 2 connected wires
- the tool recalculates `connectedWireIds` from actual wire references

A node with fewer than 2 connected wires blocks save/export in the current contract.

## 8. Wires

Rules:

- `serialNumber` must be non-empty in persisted output
- wire endpoints reference only `port` or `node` through `{ entityType, refId }`
- `route.kind` is `straight` or `polyline`
- for `polyline`, `bendPoints` contains only intermediate corners
- do not repeat the source or target endpoint coordinates inside `bendPoints`
- every persisted polyline must have at least 1 bend point

### Routing mode

Routing mode is persisted only under:

```json
{
  "extensions": {
    "easyanalyse": {
      "routing": {
        "mode": "auto"
      }
    }
  }
}
```

Rules:

- missing `routing.mode` means `auto`
- `auto` means the local tool owns route geometry and may recompute `route.kind` and `bendPoints`
- `manual` means stored user-specified polyline bend points should be preserved until the user edits them again
- wires default to automatic routing unless explicitly marked as manual

## 9. Annotations

Rules:

- annotation `text` must be non-empty in persisted output
- annotation target can reference only `component`, `port`, `node`, or `wire`
- annotations cannot target `document`
- annotations cannot target another annotation

## 10. Global invariants

Always preserve these:

- every entity `id` is globally unique
- every reference target exists
- every port anchor kind matches its component geometry
- every node `connectedWireIds` matches actual wire references
- required human-visible strings are non-empty:
  - `document.title`
  - `component.name`
  - `port.name`
  - `wire.serialNumber`
  - `annotation.text`
- polyline `bendPoints` never duplicate source or target coordinates

## 11. Tool-owned normalization

Before validation/save, the editor normalizes at least:

- `document.updatedAt`
- top-level arrays sorted by `id`
- `node.connectedWireIds` recomputed from actual wires
- empty polyline `bendPoints` repaired to a default intermediate point
- auto-routed wire geometry may be materialized from endpoints

When reporting changes back to the user, mention these derived rewrites briefly.

## 12. Save-blocking conditions

The desktop tool refuses save/export when the normalized document still violates schema or semantic validation.

Common blockers:

- duplicate IDs
- missing `port.componentId`
- wrong port anchor kind for component geometry
- missing wire endpoints
- inconsistent `node.connectedWireIds`
- node with fewer than 2 connected wires
- annotation targeting a missing entity
- polyline repeating source or target point in `bendPoints`

## 13. AI editing rules

Do:

- keep `connectedWireIds` synchronized with actual wire references
- keep ports as anchors, not absolute free points
- use `extensions.easyanalyse.rotationDeg` for rotation
- use `extensions.easyanalyse.routing.mode` for routing ownership
- mark wires `manual` only when exact user bend points must be preserved

Do not:

- add parallel alias fields for existing contract fields
- leave a polyline with empty `bendPoints`
- put source or target endpoints into `bendPoints`
- fabricate unrelated topology just to silence validation errors
- target annotations with annotations

## 14. Repair strategy

When fixing invalid files:

1. restore the required top-level shape
2. fix missing or duplicate IDs
3. repair broken references
4. fix anchor kind vs geometry mismatches
5. recompute `node.connectedWireIds`
6. repair invalid polyline bend points
7. remove invented fields not recognized by the contract
8. preserve user semantic content where possible

## 15. Minimal valid mental model

Think of the format this way:

- components define geometry
- ports attach to component boundaries through anchors
- nodes are explicit junction points
- wires connect only ports and nodes
- annotations attach to components, ports, nodes, or wires
- saveable JSON is normalized, reference-complete, and semantically valid
