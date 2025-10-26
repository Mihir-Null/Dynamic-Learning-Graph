export interface RepresentativeProfile {
  type: "resource" | "synthetic";
  label: string;
  summary: string;
  resourceId?: string;
  synthetic?: {
    id: string;
    averageDifficulty: number;
    aggregatedTags: string[];
    aggregatedPrereqModuleIds: string[];
  };
}

export interface Module {
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

export interface Resource {
  id: string;
  name: string;
  link: string;
  area: string;
  moduleId: string;
  moduleName: string;
  type: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  difficultyWeight: number;
  tagPaths: string[][];
  flatTags: string[];
  prerequisiteModuleIds: string[];
  tagPrerequisitePaths: string[][];
}

export interface TagTreeNode {
  id: string;
  name: string;
  fullPath: string;
  children: TagTreeNode[];
}

export interface GraphPayload {
  generatedAt: string;
  modules: Module[];
  resources: Resource[];
  moduleOrder: string[];
  tagTree: TagTreeNode;
}

export interface GraphResponse extends GraphPayload {
  strategy: GraphStrategy;
}

export type GraphStrategy = "representative" | "closure";

export interface GraphNode {
  id: string;
  name: string;
  area: string;
  size: number;
  closureOrder: number;
  representativeProfile: RepresentativeProfile | null;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphViewModel {
  nodes: GraphNode[];
  links: GraphLink[];
  modules: Record<string, Module>;
  resources: Record<string, Resource>;
  tagTree: TagTreeNode;
  moduleOrder: string[];
  strategy: GraphStrategy;
}
