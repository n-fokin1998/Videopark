#!/usr/bin/env node
/**
 * Local quality gate (roadmap phase 0; hosted CI comes in phase 9):
 * lint → check → unit tests → content validation → build → Playwright e2e + axe → Lighthouse.
 * Stops at the first failing step. Extra env (e.g. E2E_SKIP_FIREFOX=1) is passed through.
 */
import { spawnSync } from 'node:child_process';

const steps = [
  ['lint', 'pnpm lint'],
  ['check', 'pnpm check'],
  ['unit tests', 'pnpm test'],
  ['content', 'pnpm validate:content'],
  ['build', 'pnpm build'],
  ['e2e + axe', 'pnpm test:e2e', { E2E_SKIP_BUILD: '1' }],
  ['lighthouse', 'pnpm lighthouse'],
];

const started = Date.now();
for (const [name, command, env = {}] of steps) {
  console.log(`\n▶ ${name}: ${command}`);
  const result = spawnSync(command, { stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
  if (result.status !== 0) {
    console.error(`\n✖ verify failed at "${name}" (exit ${result.status ?? 'signal'})`);
    process.exit(result.status ?? 1);
  }
}
console.log(`\n✔ verify passed in ${Math.round((Date.now() - started) / 1000)}s`);
