# easyanalyse-exchange

A self-contained skill for AI agents working with the EASYAnalyse circuit exchange format.

It helps an agent generate, repair, normalize, validate, and explain EASYAnalyse circuit JSON without needing the original `exchange.md` file to be present locally.

## Install

Recommended: install with the `skills` CLI.

Project-level install for Codex:

```bash
npx skills add Caltsic/easyanalyse-exchange --skill easyanalyse-exchange -a codex -y
```

Global install for Codex:

```bash
npx skills add Caltsic/easyanalyse-exchange --skill easyanalyse-exchange -a codex -g -y
```

Global install for all supported agents:

```bash
npx skills add Caltsic/easyanalyse-exchange --skill easyanalyse-exchange -a '*' -g -y
```

Notes:

- `skills` uses symlinks by default
- add `--copy` if you want copied files instead
- omit `-g` for project-level install
- use `-a '*'` to install for all supported agents instead of just Codex

## Alternative Install

This repository also exposes a direct `npx` installer:

```bash
npx --yes github:Caltsic/easyanalyse-exchange
```

That installs the skill into `~/.codex/skills/easyanalyse-exchange`.

## What It Includes

Installed skill contents:

- `SKILL.md`
- `references/exchange-contract.md`
- `references/runtime-validation.md`

The skill is designed to be self-contained first, and to verify against local EASYAnalyse runtime files when they are available.

## Example Prompts

- Repair this EASYAnalyse exchange JSON and make it saveable.
- Generate a minimal valid EASYAnalyse circuit document.
- Explain why this wire or node violates the EASYAnalyse exchange contract.
- Normalize this document without changing its intended topology.

## Repository Layout

- `easyanalyse-exchange/`: installable skill directory
- `bin/install.mjs`: direct `npx` installer
- `package.json`: npm package wrapper for the installer
