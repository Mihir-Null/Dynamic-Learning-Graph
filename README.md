# Dynamic-Learning-Graph
A program to organize resources for learning any subject into a dynamic, interactive graph

#Algorithm Design (Rough Sketch)

### Objective:
- Organize topics ("modules") in a graph based on prerequisites for learning any topic.
- Each module consists of a list of resources to learn that module:
  - Every resource has a list of prerequisites that are themselves topics.

## Features and Implementation

### Module
- Each module is a set of resources to learn that module.
- Internally, each module has its own set of prerequisites:
  - This can be determined from the learning resources list.
  - Could use a form of `fold_left` with a function.
  - Modules should allow setting prerequisites explicitly or require a minimum list of prerequisites for each module.

### Satellite Modules
- A module could simply be a satellite of another module.
- Satellites may have their own prerequisites.
- Implementation: draw a line between two modules.

### Organizing into a Graph
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

## Hosting
- Consider using GitHub Pages for hosting.

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



