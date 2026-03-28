---
name: easyanalyse-exchange
description: Use when working in the EASYAnalyse project on the AI-native circuit exchange format, especially when the user mentions exchange.md, the schema, circuit JSON, components/ports/nodes/wires/annotations, or asks to generate, repair, modify, normalize, validate, or explain exchange documents for the desktop editor.
---

# EASYAnalyse Exchange

Use this skill only for the EASYAnalyse repository and its persisted circuit exchange JSON.

## Goal

Work against the real persisted contract used by the desktop editor, not UI intuition.

Typical tasks:

- generate a new exchange JSON document
- repair invalid or inconsistent circuit JSON
- modify an existing document without breaking saveability
- explain the contract and invariants to the user
- compare schema, docs, and implementation behavior

## Authoritative sources

Read only the files needed for the task, in this order:

1. `easyanalyse-desktop/src-tauri/crates/easyanalyse-core/schema/ai-native-circuit-exchange.schema.json`
2. `exchange.md`
3. `easyanalyse-desktop/src-tauri/crates/easyanalyse-core/src/validation.rs`
4. `easyanalyse-desktop/src/lib/document.ts`
5. `easyanalyse-desktop/src/types/document.ts`
6. `easyanalyse-desktop/src-tauri/src/commands.rs`
7. the root-level `*.schema.json` file only when you need to compare exported docs with runtime schema

Conflict policy:

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

1. Confirm the workspace is the EASYAnalyse repo by locating `exchange.md` and `easyanalyse-desktop`.
2. Read the schema and `exchange.md` before editing JSON.
3. If the task changes persisted behavior or asks whether something can save, read `validation.rs` and `commands.rs`.
4. If the task depends on frontend normalization or derived defaults, read `document.ts` and `types/document.ts`.
5. When producing JSON, keep it normalized and saveable.

## Contract checklist

Always preserve these rules unless the authoritative sources changed:

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
- If you changed derived fields like `connectedWireIds`, sorting, or `updatedAt`, say so briefly.
- If the user asks for JSON generation or repair, return saveable JSON rather than pseudocode unless they asked for explanation only.
