import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

interface CsvRow {
  "Resource Name": string;
  Link: string;
  Area: string;
  Module: string;
  Tags: string;
  Type: string;
  Difficulty: DifficultyLevel;
  "Prerequisite module(s)": string;
  "Tag Prerequisites"?: string;
}

interface Resource {
  id: string;
  name: string;
  link: string;
  area: string;
  moduleId: string;
  moduleName: string;
  type: string;
  difficulty: DifficultyLevel;
  difficultyWeight: number;
  tagPaths: string[][];
  flatTags: string[];
  prerequisiteModuleIds: string[];
  tagPrerequisitePaths: string[][];
}

interface ModuleNode {
  id: string;
  name: string;
  area: string;
  flatTags: Set<string>;
  tagPaths: string[][];
  resourceIds: string[];
  prerequisiteModuleIds: Set<string>;
  representativeProfiles: Record<string, RepresentativeProfile>;
  closurePrerequisites: string[];
  closureOrder: number;
}

interface RepresentativeProfile {
  type: "resource" | "synthetic";
  label: string;
  summary: string;
  resourceId?: string;
  synthetic?: SyntheticRepresentative;
}

interface SyntheticRepresentative {
  id: string;
  averageDifficulty: number;
  aggregatedTags: string[];
  aggregatedPrereqModuleIds: string[];
}

interface TagTreeNode {
  id: string;
  name: string;
  fullPath: string;
  children: Record<string, TagTreeNode>;
}

interface GraphPayload {
  generatedAt: string;
  modules: ModuleExport[];
  resources: ResourceExport[];
  moduleOrder: string[];
  tagTree: TagTreeNodeExport;
}

interface ModuleExport {
  id: string;
  name: string;
  area: string;
  flatTags: string[];
  tagPaths: string[][];
  resourceIds: string[];
  prerequisiteModuleIds: string[];
  representativeProfiles: Record<string, RepresentativeProfile>;
  closurePrerequisites: string[];
  closureOrder: number;
}

interface ResourceExport {
  id: string;
  name: string;
  link: string;
  area: string;
  moduleId: string;
  moduleName: string;
  type: string;
  difficulty: DifficultyLevel;
  difficultyWeight: number;
  tagPaths: string[][];
  flatTags: string[];
  prerequisiteModuleIds: string[];
  tagPrerequisitePaths: string[][];
}

interface TagTreeNodeExport {
  id: string;
  name: string;
  fullPath: string;
  children: TagTreeNodeExport[];
}

const difficultyWeights: Record<DifficultyLevel, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

async function main() {
  const csvPath = path.join(rootDir, "data", "resources.csv");
  const csvRaw = await fs.readFile(csvPath, "utf8");
  const rows = parseCsv<CsvRow>(csvRaw);

  const tagRoot: TagTreeNode = {
    id: "root",
    name: "root",
    fullPath: "",
    children: {}
  };

  const modules = new Map<string, ModuleNode>();
  const resources: Resource[] = [];

  rows.forEach((row) => {
    const moduleKey = createModuleKey(row.Area, row.Module);
    const moduleId = slugify(moduleKey);

    if (!modules.has(moduleId)) {
      modules.set(moduleId, {
        id: moduleId,
        name: row.Module.trim(),
        area: row.Area.trim(),
        flatTags: new Set(),
        tagPaths: [],
        resourceIds: [],
        prerequisiteModuleIds: new Set(),
        representativeProfiles: {},
        closurePrerequisites: [],
        closureOrder: -1
      });
    }

    const currentModule = modules.get(moduleId)!;

    const resourceId = slugify(`${row["Resource Name"]}-${row.Module}`);
    const tagPaths = parseHierarchyField(row.Tags);
    const flatTags = new Set<string>();
    tagPaths.forEach((pathSegments) => {
      addTagPath(tagRoot, pathSegments);
      pathSegments.forEach((_seg, idx) => {
        const subPath = pathSegments.slice(0, idx + 1).join(">");
        flatTags.add(subPath);
        currentModule.flatTags.add(subPath);
      });
      currentModule.tagPaths.push(pathSegments);
    });

    const tagPrerequisitePaths = parseHierarchyField(row["Tag Prerequisites"] ?? "");
    tagPrerequisitePaths.forEach((pathSegments) => addTagPath(tagRoot, pathSegments));

    const prerequisiteModuleNames = splitMultiField(row["Prerequisite module(s)"]);

    const prerequisiteModuleIds = prerequisiteModuleNames
      .map((name) => {
        const area = findModuleArea(rows, name, row.Area);
        const key = createModuleKey(area, name);
        const preModuleId = slugify(key);
        if (!modules.has(preModuleId)) {
          modules.set(preModuleId, {
            id: preModuleId,
            name: name.trim(),
            area: area.trim(),
            flatTags: new Set(),
            tagPaths: [],
            resourceIds: [],
            prerequisiteModuleIds: new Set(),
            representativeProfiles: {},
            closurePrerequisites: [],
            closureOrder: -1
          });
        }
        return preModuleId;
      })
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const resource: Resource = {
      id: resourceId,
      name: row["Resource Name"].trim(),
      link: row.Link.trim(),
      area: row.Area.trim(),
      moduleId,
      moduleName: row.Module.trim(),
      type: row.Type.trim(),
      difficulty: row.Difficulty,
      difficultyWeight: difficultyWeights[row.Difficulty],
      tagPaths,
      flatTags: Array.from(flatTags),
      prerequisiteModuleIds,
      tagPrerequisitePaths
    };

    resources.push(resource);
    currentModule.resourceIds.push(resource.id);
  });

  // Ensure module prerequisites include cross-module references
  modules.forEach((module) => {
    module.resourceIds.forEach((resourceId) => {
      const resource = resources.find((r) => r.id === resourceId);
      if (!resource) return;
      resource.prerequisiteModuleIds.forEach((preId) => {
        if (preId !== module.id) {
          module.prerequisiteModuleIds.add(preId);
        }
      });
    });
  });

  const topoOrder = topologicalSort(modules);
  const closureMemo = new Map<string, Set<string>>();

  modules.forEach((module) => {
    const closure = computeClosure(module.id, modules, closureMemo);
    module.closurePrerequisites = Array.from(closure);
    module.closureOrder = topoOrder.indexOf(module.id);
  });

  modules.forEach((module) => {
    const moduleResources = module.resourceIds
      .map((id) => resources.find((resource) => resource.id === id))
      .filter((resource): resource is Resource => Boolean(resource));

    module.representativeProfiles["minPrereqs"] = createRepresentativeProfile(module, moduleResources, (items) =>
      items
        .slice()
        .sort((a, b) => {
          if (a.prerequisiteModuleIds.length !== b.prerequisiteModuleIds.length) {
            return a.prerequisiteModuleIds.length - b.prerequisiteModuleIds.length;
          }
          if (a.difficultyWeight !== b.difficultyWeight) {
            return a.difficultyWeight - b.difficultyWeight;
          }
          return a.name.localeCompare(b.name);
        })
        .at(0)
    );

    module.representativeProfiles["aggregated"] = createAggregateProfile(module, moduleResources);
  });

  const payload: GraphPayload = {
    generatedAt: new Date().toISOString(),
    modules: Array.from(modules.values()).map((module) => ({
      id: module.id,
      name: module.name,
      area: module.area,
      flatTags: Array.from(module.flatTags),
      tagPaths: module.tagPaths,
      resourceIds: module.resourceIds,
      prerequisiteModuleIds: Array.from(module.prerequisiteModuleIds),
      representativeProfiles: module.representativeProfiles,
      closurePrerequisites: module.closurePrerequisites,
      closureOrder: module.closureOrder
    })),
    resources: resources.map((resource) => ({
      ...resource,
      prerequisiteModuleIds: resource.prerequisiteModuleIds
    })),
    moduleOrder: topoOrder,
    tagTree: serializeTagTree(tagRoot)
  };

  const outputPath = path.join(rootDir, "data", "graph.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Graph payload written to ${outputPath}`);
}

function createModuleKey(area: string, moduleName: string) {
  return `${area.trim()}::${moduleName.trim()}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseHierarchyField(value: string) {
  if (!value) return [];
  return value
    .split("|")
    .map((entry) =>
      entry
        .split(">")
        .map((segment) => segment.trim())
        .filter(Boolean)
    )
    .filter((segments) => segments.length > 0);
}

function splitMultiField(value: string) {
  if (!value) return [];
  return value
    .split("|")
    .flatMap((chunk) => chunk.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function addTagPath(root: TagTreeNode, pathSegments: string[]) {
  let current = root;
  pathSegments.forEach((segment, index) => {
    if (!current.children[segment]) {
      const fullPath = pathSegments.slice(0, index + 1).join(">");
      current.children[segment] = {
        id: slugify(fullPath),
        name: segment,
        fullPath,
        children: {}
      };
    }
    current = current.children[segment];
  });
}

function serializeTagTree(node: TagTreeNode): TagTreeNodeExport {
  return {
    id: node.id,
    name: node.name,
    fullPath: node.fullPath,
    children: Object.values(node.children).map(serializeTagTree)
  };
}

function topologicalSort(modules: Map<string, ModuleNode>) {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  modules.forEach((module) => {
    inDegree.set(module.id, 0);
    adjacency.set(module.id, []);
  });

  modules.forEach((module) => {
    module.prerequisiteModuleIds.forEach((pre) => {
      if (!inDegree.has(module.id)) return;
      inDegree.set(module.id, (inDegree.get(module.id) ?? 0) + 1);
      adjacency.get(pre)?.push(module.id);
    });
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  const order: string[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    order.push(current);
    adjacency.get(current)?.forEach((neighbor) => {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  if (order.length !== modules.size) {
    throw new Error("Detected a cycle in module prerequisites. Please resolve circular dependencies.");
  }

  return order;
}

function computeClosure(
  moduleId: string,
  modules: Map<string, ModuleNode>,
  memo: Map<string, Set<string>>
): Set<string> {
  if (memo.has(moduleId)) {
    return new Set(memo.get(moduleId)!);
  }

  const module = modules.get(moduleId);
  if (!module) return new Set();

  const aggregate = new Set<string>();
  module.prerequisiteModuleIds.forEach((preId) => {
    aggregate.add(preId);
    computeClosure(preId, modules, memo).forEach((nested) => aggregate.add(nested));
  });

  memo.set(moduleId, aggregate);
  return new Set(aggregate);
}

function createRepresentativeProfile(
  module: ModuleNode,
  resources: Resource[],
  selector: (resources: Resource[]) => Resource | undefined
): RepresentativeProfile {
  const resource = selector(resources);
  if (!resource) {
    return {
      type: "synthetic",
      label: "Unavailable",
      summary: "No resources available for representative selection.",
      synthetic: {
        id: `synthetic-${module.id}`,
        averageDifficulty: 0,
        aggregatedTags: [],
        aggregatedPrereqModuleIds: []
      }
    };
  }

  return {
    type: "resource",
    label: resource.name,
    summary: `Selected by minPrereqs strategy with ${resource.prerequisiteModuleIds.length} prerequisite modules.`,
    resourceId: resource.id
  };
}

function createAggregateProfile(module: ModuleNode, resources: Resource[]): RepresentativeProfile {
  if (!resources.length) {
    return {
      type: "synthetic",
      label: "Aggregate",
      summary: "No resources to aggregate.",
      synthetic: {
        id: `synthetic-${module.id}`,
        averageDifficulty: 0,
        aggregatedTags: [],
        aggregatedPrereqModuleIds: []
      }
    };
  }

  const aggregatedTags = new Set<string>();
  const aggregatedPrereqs = new Set<string>();
  let totalDifficulty = 0;

  resources.forEach((resource) => {
    resource.flatTags.forEach((tag) => aggregatedTags.add(tag));
    resource.prerequisiteModuleIds.forEach((pre) => aggregatedPrereqs.add(pre));
    totalDifficulty += resource.difficultyWeight;
  });

  const synthetic: SyntheticRepresentative = {
    id: `synthetic-${module.id}`,
    averageDifficulty: totalDifficulty / resources.length,
    aggregatedTags: Array.from(aggregatedTags),
    aggregatedPrereqModuleIds: Array.from(aggregatedPrereqs)
  };

  return {
    type: "synthetic",
    label: `${module.name} Aggregate`,
    summary: "Synthetic representative aggregating all module resources.",
    synthetic
  };
}

function findModuleArea(rows: CsvRow[], moduleName: string, defaultArea: string) {
  const found = rows.find((row) => row.Module.trim() === moduleName.trim());
  return found?.Area ?? defaultArea;
}

function parseCsv<T>(csvRaw: string): T[] {
  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    return record as T;
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
