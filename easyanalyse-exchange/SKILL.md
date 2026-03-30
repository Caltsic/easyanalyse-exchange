---
name: easyanalyse-exchange
description: Use when working on the EASYAnalyse circuit exchange format, especially for circuit JSON generation, repair, validation, spatial layout, component sizing, signal flow, annotations, and multi-level abstraction reasoning.
---

# EASYAnalyse Exchange

Use this skill for EASYAnalyse persisted circuit exchange JSON.

This skill must remain useful even when the local EASYAnalyse repository files are not present.
Treat the bundled references as the default contract source.

## Goal

Work against the real persisted contract used by the desktop editor, not UI intuition.

Typical tasks:

- generate a new exchange JSON document
- repair invalid or inconsistent circuit JSON
- modify an existing document without breaking saveability
- plan canvas layout, component sizing, and signal flow
- work with wire routing behavior, including automatic vs manual bend-point preservation
- trace signals and annotate electrical behavior
- explain the contract and invariants to the user
- compare schema, docs, and implementation behavior

## Bundled references

Read these first:

1. `references/exchange-contract.md`
2. `references/runtime-validation.md`
3. `references/layout-and-analysis.md`

These references are the self-contained contract for installed users.

## Local project verification

If the user is working inside the real EASYAnalyse repository, verify against local sources in this order:

1. `easyanalyse-desktop/src-tauri/crates/easyanalyse-core/schema/ai-native-circuit-exchange.schema.json`
2. `exchange.md`
3. `easyanalyse-desktop/src-tauri/crates/easyanalyse-core/src/validation.rs`
4. `easyanalyse-desktop/src/lib/document.ts`
5. `easyanalyse-desktop/src/types/document.ts`
6. `easyanalyse-desktop/src-tauri/src/commands.rs`
7. `easyanalyse-desktop/src/lib/geometry.ts` when the task touches wire geometry, routing, path rendering, or bend-point preservation
8. `easyanalyse-desktop/src/store/editorStore.ts` when the task touches editor-side route mutation defaults or save preparation
9. the root-level `*.schema.json` file only when you need to compare exported docs with runtime schema

Conflict policy:

- If bundled references conflict with verified local runtime sources, prefer the verified local runtime sources and mention the drift.
- If `exchange.md` conflicts with the schema, the schema wins.
- If the schema permits multiple shapes but the implementation normalizes or derives fields, follow the implementation for persisted output.
- Treat save behavior in `commands.rs` and semantic validation in `validation.rs` as the final implementation truth.
- If the root-level schema copy differs from the bundled runtime schema, prefer the bundled runtime schema.

If paths moved, search the workspace for:

- `exchange.md`
- `*.schema.json`
- `validate_value`
- `normalize_document`
- `normalizeDocumentLocal`

## Fast workflow

1. Read `references/exchange-contract.md`.
2. Read `references/runtime-validation.md`.
3. If the task involves generation from scratch, spatial layout, abstraction choice, signal tracing, or annotation strategy, read `references/layout-and-analysis.md`.
4. If the workspace looks like the real EASYAnalyse repo, verify the relevant local files before claiming implementation-exact behavior.
5. If the task changes persisted behavior or asks whether something can save, read local `validation.rs` and `commands.rs` when available.
6. If the task depends on frontend normalization or derived defaults, read local `document.ts` and `types/document.ts` when available.
7. If the task involves wire routing, exact bend points, or why a rendered route changed, read local `geometry.ts` and `editorStore.ts` when available.
8. When producing JSON, keep it normalized and saveable.

## Contract checklist

Always preserve these rules unless verified local runtime sources changed:

- Top-level shape is one JSON document with `schemaVersion`, `document`, `canvas`, `components`, `ports`, `nodes`, `wires`, `annotations`, and optional `extensions`.
- `components`, `ports`, `nodes`, `wires`, and `annotations` are top-level arrays. Do not nest ports under components.
- Use camelCase exactly. Do not invent snake_case aliases.
- All entity `id` values must be globally unique across the whole file, including `document.id`.
- `document.title`, component `name`, port `name`, wire `serialNumber`, and annotation `text` must be non-empty in persisted output.
- `port.componentId` must reference an existing component.
- Port position is persisted as `anchor`, not free `x/y`.
- Port anchor kind must match the component geometry type.
- Wire endpoints reference only `port` or `node` via `{ entityType, refId }`.
- `wire.route.kind = "polyline"` stores only intermediate `bendPoints`; do not repeat source or target points there.
- Wire routing mode is persisted only under `extensions.easyanalyse.routing.mode`.
- Missing `routing.mode` means `auto`.
- In `auto` mode, `source` and `target` are authoritative and the local tool may recompute `route.kind` and `bendPoints` during load, edit, validation, and save.
- In `manual` mode, stored user-specified polyline bend points should be preserved unless the user edits them again.
- `annotation.target.entityType` can target `component`, `port`, `node`, or `wire`, not `document` or `annotation`.
- Component rotation is persisted only under `extensions.easyanalyse.rotationDeg`.
- `node.connectedWireIds` is derived from actual wire references and must be recomputed, then sorted.
- Persisted arrays should be sorted by `id` to reduce diff noise.
- `document.updatedAt` is refreshed during normalization/save; do not treat the incoming value as authoritative.

## Repair policy

When fixing broken JSON:

- Prefer removing invented fields over trying to preserve them.
- Prefer recalculating derived fields over preserving stale values.
- Preserve user-authored semantic content where possible: titles, names, serial numbers, descriptions, annotation text.
- If an endpoint target is missing, either repair the reference to an existing entity or report the document as invalid; do not silently fabricate unrelated topology.
- If a port was represented with free coordinates, convert it into a valid `anchor` for the owning geometry.
- If a component has rotation, keep it only in `extensions.easyanalyse.rotationDeg`.
- If a wire should keep exact user bend points, mark it `manual`.
- If a wire is tool-routed or you are regenerating its path from endpoints, use `auto` or omit `routing.mode`.
- Do not promise stable stored bend points in `auto` mode; the local tool may rewrite them.

## Saveability rule

The desktop app saves only after `validate_value(...)` reports both:

- `schema_valid = true`
- `semantic_valid = true`

Before claiming a JSON document is ready, verify at least these implementation-backed semantic checks:

- duplicate IDs
- missing `port.componentId`
- incompatible `port.anchor` vs component geometry
- missing wire endpoints
- repeated source/target points inside `wire.route.bendPoints`
- inconsistent `node.connectedWireIds`
- missing annotation targets

## Response style

When answering the user:

- Be explicit about whether a statement came from schema, `exchange.md`, or implementation.
- Call out inferred behavior as inference.
- If you changed derived fields like `connectedWireIds`, sorting, `updatedAt`, or auto-routed wire geometry, say so briefly.
- If signal analysis depends on assumptions, state the assumptions explicitly.
- If the user asks for JSON generation or repair, return saveable JSON rather than pseudocode unless they asked for explanation only.
