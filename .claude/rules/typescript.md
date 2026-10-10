---
paths:
  - "src/**/*.ts"
  - "src/**/*.svelte"
  - "src/**/*.astro"
  - "scripts/**/*.ts"
---

# TypeScript rules

- `tsconfig` extends `astro/tsconfigs/strictest`. No `any`; use `unknown` + narrowing. No non-null assertions (`!`) except in tests.
- Prefer `type` aliases for unions and data shapes, `interface` for component `Props`.
- Derive types from Zod schemas and Astro (`CollectionEntry<'releases'>`, `z.infer<typeof schema>`) — never duplicate content types by hand.
- `import type` for type-only imports. Path alias `~/` → `src/`.
- Pure logic lives in `src/lib/` as small, side-effect-free functions with unit tests (`*.test.ts` next to the file).
  Components call lib functions; they don't contain business logic (sorting, date math, relations, slugging).
- Partial dates (`"2017"`, `"2017-03"`, `"2017-03-01"`) are handled only through `src/lib/dates.ts` — never `new Date("2017")` directly
  (timezone and precision bugs).
- Exhaustive `switch` over unions with a `never` check.
- Named exports only (except where Astro/Svelte require default).
- No barrel files that pull client code into server bundles accidentally; import from the concrete module.
- Client-side code must guard browser APIs (`typeof window`, `matchMedia`) when the module can be imported during SSR.
- Errors: fail the build loudly on bad content (throw with entry id and field); fail soft in the browser (log once, show a calm fallback).
- Scripts in `scripts/` run with `tsx`, read secrets only from `process.env`, are idempotent, and never run implicitly during `astro build`.
