# Dynamic-Learning-Graph
A program to organize resources for learning any subject into a dynamic, interactive graph

# Algorithm Design (Rough Sketch)

### Objective:
- Organize topics ("modules") in a graph based on prerequisites for learning any topic.
- Each module consists of a list of resources to learn that module:
  - The details of a resource are specified below
  - For further segmentation inside a module we have "tags" to show what aspects of a module a particular resource covers
  - tags are hierarchical, so a particular resource can have multiple tags that are nested inside one another (for example topological error correction would be a subtag of quantum error correction) and tagging a resource with topological error correction would automatically tag it with all parent tags (might be able to implement with inheritance)

## Features and Implementation

### Areas
 - These are the highest levels of the learning graph and generalize the broad overarching aspect of the field being covered
 - Areas should be infinitely "nestable"/hierarchical

### Resources
Resources are the core of the graph, these are materials including websites, courses, videos, lectures, book, etc that teach some variety of topics
They have the following attributes:
 - The Module(s)/Tag(s) that they are a part of
 - the type of media the resource is (e.g video, course etc.)
 - subtopic tags
  - subtopics/tags/subtags should be hierarchical and be determined by a tree that is also defined by the developer/user
 - Preqrequisite module(s)
 - difficulty level
 - tag prerequisites
 - done/not done (boolean)
Resources are determined from a csv file that has 

### Module/Topic
- Each module is a set of resources to learn that module.
- Each module is differentiated by area (Career - Quantum Software is different from Programming - Quantum Software)
- Internally, each module has its own "representative":
  - This can representative is determined from the learning resources list for that module + a higher order function passed in at or before runtime
    - For example an internal "representative resource" could be determined by passing a min_prereqs function that just picks the resource with the minimum number of prereqs as the representative. or an "aggregate" function that constructs a "fake" internal representative that has all the prerequisites of every resource in that module combined
  - different higher order functions can be sent in to similarly determine each of the various attributes of the "representative resource" to determine all other usual attributes a resource has
- New modules can also be created internally based on a graph wide hyperparameter that is essentially a recursion limit: 
  - if a certain subtopic tag gains enough "tags" below it then that subtopic should be promoted to its own module that "satellites" the main one
  - this could also be implemented differently by promoting the overall module to an area and turning each highest level subtopic/tag within it into its own module
  

### Satellite Modules
- A module could simply be a satellite of another module.
- Satellites may have their own prerequisites.
- Implementation: draw a line between two modules.

### Organizing into a Graph
Tree version:
- **Columns**:
  - Determined by the overall category of the resource.
  - Every resource should inherit the column number of its main prerequisite (if one exists).
  - Modules sharing a prerequisite should grow sideways from the main prerequisite.
  - Alternatively, organize by similarity based on tags.

- **Rows**:
  - Determined recursively:
    - Add one to the maximum row number of its prerequisites.

- **Prerequisites**:
  - Draw lines from each module to all its prerequisite modules.

Physics based graph
  An alternative version would be to make a physics based version that simply links all modules together according to prerequisites and then attempts to separate by having linkages apply force between modules and have "strands" repel each other

## Hosting
- Consider using GitHub Pages for hosting.
- Neo4j could be used to host the actual graph constructed based off a csv and then served to users to view and organize client side

## Todo

### Classes for Modules and Resources
#### Module
- List of resources.
- Prerequisites + determination:
  - Ensure prerequisites are folded in recursively:
    - Gather all nested prerequisites into a set.
    - Remove duplicates from higher-level prerequisite lists.
  - Use wave + backwash techniques.

#### Resource
- Attributes:
  - Name.
  - Link.
  - Category.
  - Tags.
  - Supposed prerequisite list.

### Determine Row and Column
- Compute rows first.
- Compute columns afterward.

### Drawing the Graph
- **Module Bubbles**:
  - Contain all resources in the module list.
  - Update module prerequisites based on the selected resource.

- **Bubble Placement**:
  - Arrange bubbles by row and column.

- **Lines**:
  - Draw lines to prerequisites.

- **Culling Options**:
  - Filter modules by matching or non-matching criteria and their prerequisites.
  - Maintain a list of matching modules and operate on it.

### Additional Features
- Explore other options for organizing and displaying the graph.

## Code Overview

### Data Ingestion & Graph Construction (Apps Script)
- `Graph.gs` houses the Apps Script that converts a Google Sheet (`Resources` tab) into the canonical module/resource graph.
  - **Class `Module`** (`Graph.gs`): Keeps module metadata (`name`, spreadsheet-derived `rowNo`/`colNo` place-holders, `resourceList`, computed `representative`, `prereqs`, `category`). The `prereq_fold_left` method reduces the module’s resource prerequisites into a single `Set` via a reducer such as `union`.
  - **Class `Resource`** (`Graph.gs`): Captures individual learning materials (`name`, `link`, module association, `prereqModules`, `category`, `tags`). `convertPrereqModules` resolves string prerequisite names into actual `Module` instances, warning if a module name is missing from the global map.
  - **Helper reducers**:
    - `union(accumulator, curr)` merges module prerequisite sets across resources.
    - `intersection(accumulator, curr)` (placeholder; currently returns an unused `Set`) intended for shared prerequisite derivations.
  - **Global state**: `graph_resource_list` (flat list of all `Resource` objects) and `moduleMap` (`Map<string, Module>` keyed by module name) hold the working dataset during ingestion.
  - **`generateGraphResourceList()`**: Reads spreadsheet rows, instantiates modules/resources, attaches resources to modules, resolves prerequisite references, and refreshes `graph_resource_list`. This function is invoked before exports to JSON or debugging.
  - **`myFunction()`**: Example console routine that invokes `generateGraphResourceList`, iterates modules, folds prerequisites with `union`, then logs intermediate results—useful while evolving the reducer logic.

### Static Payload
- `data/graph.json` stores the serialized `GraphPayload` consumed by the local Next.js UI. It contains timestamped metadata, denormalized module/resource lists, prerequisite orderings, and the hierarchical tag tree generated by the Apps Script process.

### Shared Types & Utilities
- `lib/types.ts`: Authoritative TypeScript interfaces representing the JSON contract (`Module`, `Resource`, `GraphPayload`, `GraphResponse`, `TagTreeNode`, etc.) and the `GraphStrategy` union (`"representative"` vs `"closure"`). These types are shared across the API handler, React UI, and data utilities.
- `lib/utils/graph.ts` centralizes client-side transformations:
  - `toViewModel(payload, strategy)` converts the raw payload into a render-ready `GraphViewModel` (maps for fast lookup, Cytoscape-like node/link lists, tag tree mirror, and strategy echo).
  - `pickRepresentativeProfile(module, strategy)` selects the module profile (`minPrereqs` or `aggregated`) used throughout the UI based on the current strategy.
  - `deriveRepresentativeResource(module, resources, strategy)` resolves a concrete `Resource` to act as the strategy-aligned exemplar (synthetic aggregations fall back to the closest real resource by difficulty/tag overlap).
  - `scoredResourcesForModule(module, resources, strategy)` ranks resources relative to the representative via `similarityScore`.
  - `similarityScore(base, candidate)` weights shared tags and prerequisites against difficulty differences. Helper `overlapCount(left, right)` counts list intersections for tags/prereqs.

### Next.js Application Structure
- **Routing**
  - `app/layout.tsx`: Wraps all pages with `ThemeRegistry` and `globals.css`.
  - `app/page.tsx`: Main client page. Fetches `/api/graph`, manages strategy switching, loading/error states, and funnels data to the graph canvas, module inspector, and tag hierarchy card.
  - `app/api/graph/route.ts`: Serverless handler that reads `data/graph.json`, normalizes the `strategy` query param, and returns a typed payload (no mutation).
- **Theming**
  - `components/ThemeRegistry.tsx`: Registers the Emotion cache and injects the custom Material UI theme on both server and client renders.
  - `lib/theme/index.ts`: Defines the Material-inspired dark theme—vibrant accent palette, glassmorphism surfaces, component overrides (Cards, Paper, Chip, Button, ToggleButton), and `CssBaseline` gradients.
  - `app/globals.css`: Global resets, default typography stack, and selection styling complementing the theme.

### Visualization & UI Components
- `components/GraphScene.tsx`: Custom canvas renderer for the force-directed module graph.
  - Builds a `d3-force-3d` simulation with strategy-dependent link strengths.
  - Derives a multi-hued node palette from the theme, hashes module area identifiers to provide stable coloring, and draws neon-glow nodes with rounded-label backplates (`drawRoundedRect`).
  - Handles pointer events for drag-to-move and click-to-select, syncing with parent selection state, and re-renders via `requestAnimationFrame`.
  - Utility helpers (`colorForNode`, `hashString`, `withAlpha`, `hexToRgba`) keep rendering logic encapsulated.
- `components/ModuleResourcesPanel.tsx`: Side panel for inspecting a module’s resources.
  - Accepts the selected `Module`, resource dictionary, and current strategy.
  - Filters resources by search input, highlights similarity scores, expands list items to show metadata (`difficulty`, `type`, prerequisites, area), and deep-links out to external URLs with Material chips/buttons.
- `components/TagTreeCard.tsx`: Collapsible view of the hierarchical tag tree.
  - Uses recursive `TagBranch` to render multi-depth chip stacks with alternating accent colors derived from the theme.
- `components/ui/StrategyToggle.tsx`: Material toggle group allowing users to switch between representative and closure graph modes (physics variant stubbed for future work).

### Application Flow
1. **Data Preparation** (Apps Script): `generateGraphResourceList` aggregates spreadsheet data, exports into `graph.json`.
2. **Runtime Fetch** (Next API): Client requests `/api/graph?strategy=...`; `route.ts` returns the static payload plus normalized strategy.
3. **View Model Projection**: `app/page.tsx` calls `toViewModel` to assemble nodes/links and supporting lookup maps.
4. **Rendering**:
   - `GraphScene` draws the canvas graph and raises selection callbacks.
   - `ModuleResourcesPanel` and `TagTreeCard` consume the same view model for detail context.
   - Strategy changes propagate through React state and recompute the representative logic and node sizing.

Use this overview as the authoritative map when extending the ingestion pipeline, adjusting strategies, or adding new UI surfaces. Update both the type definitions and README when introducing new structures or visualization layers.


