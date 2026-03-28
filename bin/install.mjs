#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_NAME = "easyanalyse-exchange";
const SKILL_SOURCE_DIR = "easyanalyse-exchange";

function printHelp() {
  console.log(`Install the ${SKILL_NAME} skill into Codex.

Usage:
  easyanalyse-exchange-install [--dest <skills-dir>] [--force]

Options:
  --dest <skills-dir>  Override the target skills directory. Defaults to %CODEX_HOME%/skills or ~/.codex/skills.
  --force              Replace an existing installed skill directory.
  --help               Show this help message.`);
}

function parseArgs(argv) {
  let destRoot;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      printHelp();
      process.exit(0);
    }

    if (value === "--force") {
      force = true;
      continue;
    }

    if (value === "--dest") {
      index += 1;
      destRoot = argv[index];
      if (!destRoot) {
        throw new Error("Missing value after --dest.");
      }
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return { destRoot, force };
}

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

function packageRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function copyRecursive(source, target) {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function installSkill({ destRoot, force }) {
  const sourceRoot = packageRoot();
  const skillsRoot = path.resolve(destRoot || path.join(codexHome(), "skills"));
  const skillTarget = path.join(skillsRoot, SKILL_NAME);
  const skillSource = path.join(sourceRoot, SKILL_SOURCE_DIR);

  if (!fs.existsSync(path.join(skillSource, "SKILL.md"))) {
    throw new Error(`Skill source is invalid: ${skillSource}`);
  }

  if (fs.existsSync(skillTarget)) {
    if (!force) {
      throw new Error(
        `Destination already exists: ${skillTarget}. Re-run with --force to replace it.`,
      );
    }
    removeIfExists(skillTarget);
  }

  copyRecursive(skillSource, skillTarget);

  if (!fs.existsSync(path.join(skillTarget, "SKILL.md"))) {
    throw new Error("SKILL.md was not installed. Package contents are invalid.");
  }

  return skillTarget;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const target = installSkill(args);
  console.log(`Installed ${SKILL_NAME} to ${target}`);
  console.log("Restart Codex to pick up the new skill.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}
