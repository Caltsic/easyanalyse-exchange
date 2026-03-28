# EASYAnalyse Runtime Validation Notes

This reference captures current implementation-backed behavior that matters when deciding whether a generated or repaired document will actually save.

Use it as the default behavior guide when the local runtime code is unavailable.

## 1. Save gate

Current runtime behavior is:

- validate schema
- parse into the runtime model
- normalize the document
- run semantic validation
- save only when both schema validation and semantic validation succeed

In practice this means:

- a document can look structurally close to valid and still be blocked
- normalization may change derived fields before validation outcomes are final

## 2. Normalization behavior

Current normalization behavior includes:

- recomputing `node.connectedWireIds` from actual wire references
- sorting `components`, `ports`, `nodes`, `wires`, and `annotations` by `id`
- refreshing `document.updatedAt`
- filling empty polyline routes with a default bend point
- materializing automatic wire routes before save preparation on the editor side

## 3. Semantic checks that matter

At minimum, a saveable document must satisfy:

- all IDs are globally unique
- every `port.componentId` points to an existing component
- every port anchor kind matches the owning component geometry
- every wire endpoint exists
- polyline `bendPoints` do not duplicate source or target coordinates
- every node's `connectedWireIds` matches actual references
- every annotation target exists

## 4. Editor-side routing behavior

Current editor behavior:

- wires default to automatic routing
- manual routing is set when the user creates or edits polyline bend points
- automatic routes may be recomputed from endpoints and routing obstacles
- manual polylines are intended to preserve stored bend points

Implication:

- never promise exact bend-point stability for `auto` wires
- if the user cares about exact polyline geometry, use `manual`

## 5. How to answer users

When you say something is valid, be precise:

- if you are relying on bundled references only, say it follows the documented contract
- if you also checked local runtime files, say it matches current implementation
- if you changed derived fields like `updatedAt`, sorted arrays, `connectedWireIds`, or auto-routed geometry, mention that explicitly
