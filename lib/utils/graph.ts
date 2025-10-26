import {
  GraphPayload,
  GraphStrategy,
  GraphViewModel,
  Module,
  Resource
} from "@/lib/types";

const difficultyRank: Record<Resource["difficulty"], number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3
};

export function toViewModel(payload: GraphPayload, strategy: GraphStrategy): GraphViewModel {
  const modulesById = Object.fromEntries(payload.modules.map((module) => [module.id, module]));
  const resourcesById = Object.fromEntries(payload.resources.map((resource) => [resource.id, resource]));

  const nodes = payload.modules.map((module) => ({
    id: module.id,
    name: module.name,
    area: module.area,
    size: Math.max(4, module.resourceIds.length * 4 + 8),
    closureOrder: module.closureOrder,
    representativeProfile: pickRepresentativeProfile(module, strategy)
  }));

  const links = payload.modules.flatMap((module) =>
    module.prerequisiteModuleIds.map((pre) => ({
      source: module.id,
      target: pre
    }))
  );

  return {
    nodes,
    links,
    modules: modulesById,
    resources: resourcesById,
    tagTree: payload.tagTree,
    moduleOrder: payload.moduleOrder,
    strategy
  };
}

export function pickRepresentativeProfile(module: Module, strategy: GraphStrategy) {
  if (strategy === "representative") {
    return module.representativeProfiles["minPrereqs"] ?? null;
  }
  if (strategy === "closure") {
    return module.representativeProfiles["aggregated"] ?? null;
  }
  return null;
}

export function deriveRepresentativeResource(
  module: Module,
  resources: Record<string, Resource>,
  strategy: GraphStrategy
) {
  const profile = pickRepresentativeProfile(module, strategy);
  if (!profile) return undefined;
  if (profile.type === "resource" && profile.resourceId) {
    return resources[profile.resourceId];
  }
  if (profile.type === "synthetic" && profile.synthetic) {
    const moduleResources = module.resourceIds.map((id) => resources[id]).filter(Boolean);
    return moduleResources
      .slice()
      .sort((a, b) => {
        const diff = difficultyRank[b.difficulty] - difficultyRank[a.difficulty];
        if (diff !== 0) return diff;
        const sharedA = overlapCount(a.flatTags, profile.synthetic!.aggregatedTags);
        const sharedB = overlapCount(b.flatTags, profile.synthetic!.aggregatedTags);
        if (sharedA !== sharedB) return sharedB - sharedA;
        return a.name.localeCompare(b.name);
      })
      .at(0);
  }
  return undefined;
}

export function scoredResourcesForModule(
  module: Module,
  resources: Record<string, Resource>,
  strategy: GraphStrategy
) {
  const representative = deriveRepresentativeResource(module, resources, strategy);
  return module.resourceIds
    .map((id) => resources[id])
    .filter((resource): resource is Resource => Boolean(resource))
    .map((resource) => ({
      resource,
      similarity: representative ? similarityScore(representative, resource) : 0
    }))
    .sort((a, b) => {
      if (b.similarity !== a.similarity) return b.similarity - a.similarity;
      return a.resource.name.localeCompare(b.resource.name);
    });
}

export function similarityScore(base: Resource, candidate: Resource) {
  const sharedTags = overlapCount(base.flatTags, candidate.flatTags);
  const difficultyGap = Math.abs(difficultyRank[base.difficulty] - difficultyRank[candidate.difficulty]);
  const sharedPrereqs = overlapCount(base.prerequisiteModuleIds, candidate.prerequisiteModuleIds);
  return sharedTags * 2 + sharedPrereqs - difficultyGap;
}

function overlapCount(left?: string[], right?: string[]) {
  if (!left || !right || left.length === 0 || right.length === 0) {
    return 0;
  }
  const rightSet = new Set(right);
  return left.reduce((count, token) => count + (rightSet.has(token) ? 1 : 0), 0);
}
