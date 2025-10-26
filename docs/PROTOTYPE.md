# Prototype Pipeline

## Overview
- `scripts/build-graph.ts` ingests `data/resources.csv`, materialises hierarchical tags, computes prerequisite closures (topological sort + DFS), and emits `data/graph.json`.
- `data/graph.json` feeds the Next.js app, letting the UI swap between higher-order representative selection and closure-driven ordering without touching the ingestion code.
- Hierarchical tags are represented as `TagTreeNode` objects so the UI can render the tree alongside the force-directed graph.

## Runbook
- Install dependencies: `npm install`.
- Regenerate graph data after editing the CSV: `npm run build:data` (writes `data/graph.json`).
- Start the UI locally: `npm run dev` and open `http://localhost:3000`.

## UI Highlights
- Strategy toggle (`Representative` vs `Closure`) swaps the representative profile used for each module and animates link particles in closure mode.
- Physics-based view runs a custom `d3-force-3d` canvas simulation with Material-inspired styling so the graph stabilises naturally without VR dependencies.
- Selecting a module reveals a searchable, similarity-ranked resource list. Expansion chips expose difficulty, media type, direct link, and prerequisite modules.
- Tag tree card mirrors the hierarchical taxonomy emitted by the pipeline for quick visual auditing.

## Extending the Prototype
- Add more ingestion strategies by exporting additional representative profiles from `build-graph.ts`; the API already returns every profile, so the UI toggle only needs new labels.
- Swap `data/resources.csv` for a remote export by replacing the CSV read in `build-graph.ts` (e.g., fetch from Google Sheets) before writing `graph.json`.
- Move persistence to Neo4j by replaying the payload: create `Module` and `Resource` nodes, store tag relationships, and keep the Next.js UI by replacing the `/api/graph` loader with a Neo4j-backed resolver.
