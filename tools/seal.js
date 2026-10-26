#!/usr/bin/env node
/**
 * seal.js — seal (or unseal) a solution file by hand.
 *
 *   node tools/seal.js sol.js            print the sealed string
 *   node tools/seal.js sol.js --check    also verify the round-trip
 *   node tools/seal.js --open <cipher>   print the plaintext of a sealed string
 *
 * Lab manifests are normally produced by tools/gen-labs.js, which seals for
 * you; this is for inspecting a manifest or sealing a one-off.
 */
import { readFileSync } from "node:fs";
import { sealSolution, unsealSolution } from "../jsrunner.js";

const args = process.argv.slice(2);
if (args[0] === "--open") {
  console.log(unsealSolution(args[1]));
} else if (args[0]) {
  const src = readFileSync(args[0], "utf8");
  const sealed = sealSolution(src);
  console.log(sealed);
  if (args.includes("--check") && unsealSolution(sealed) !== src) {
    console.error("round-trip FAILED");
    process.exit(1);
  }
} else {
  console.error("Usage: node tools/seal.js <file> [--check] | --open <cipher>");
  process.exit(1);
}
