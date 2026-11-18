import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";

const bin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

function run(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

const generate = run(bin, ["generate", "--config", "prisma7.config.ts"]);
if (generate.status !== 0) process.exit(generate.status ?? 1);

let migration;
for (let attempt = 1; attempt <= 5; attempt += 1) {
  migration = run(bin, ["migrate", "deploy", "--config", "prisma7.config.ts"]);
  if (migration.status === 0) break;
  if (attempt < 5) {
    console.log(`Migration lock may be busy. Retrying in ${attempt * 10} seconds (${attempt}/5)...`);
    await delay(attempt * 10000);
  }
}

if (migration?.status !== 0) {
  console.error("Database migrations could not be applied after retries.");
  process.exit(migration?.status ?? 1);
}

const seed = run(bin, ["db", "seed", "--config", "prisma7.config.ts"]);
if (seed.status !== 0) process.exit(seed.status ?? 1);

const nextBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);
const build = run(nextBin, ["build"]);
process.exit(build.status ?? 1);
