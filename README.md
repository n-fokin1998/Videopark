# Станция Видеопарк

A digital archive and musical memorial for «Станция Видеопарк» (Brovary, 2016–2020) and Женя Мычак (1999–2020).

- Start here: [AGENTS.md](AGENTS.md) — project overview, stack, conventions, links to all docs.
- Product: [docs/vision.md](docs/vision.md) · Structure: [docs/information-architecture.md](docs/information-architecture.md) ·
  Design: [docs/design.md](docs/design.md) · Plan: [docs/roadmap.md](docs/roadmap.md)
- Source research (RU): [content/knowlage-base/](content/knowlage-base/)

Status: phases 0–1 done — the empty line of stations is walkable and all owner content is modelled and validated
(`pnpm validate:content`; developer view at `/debug/content` in `pnpm dev`). Next: phase 2, platform, navigation and the player.

```bash
pnpm install
pnpm exec playwright install   # browsers for e2e (once)
pnpm dev                       # http://localhost:4321
pnpm verify                    # full local quality gate
```
