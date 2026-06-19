import { PackageSite, DependencyNode, PackageHistory, ImpactResult, ImpactDependent } from '../types/package';

export function resolveDependencyTree(
  packageName: string,
  packages: PackageSite,
  visited: Set<string> = new Set()
): DependencyNode[] {
  const pkg = packages[packageName];
  if (!pkg || !pkg.deps) {
    return [];
  }

  const dependencies: DependencyNode[] = [];

  for (const [depName, depInfo] of Object.entries(pkg.deps)) {
    if (visited.has(depName)) {
      dependencies.push({
        name: depName,
        version: depInfo.version,
        children: [],
        isCircular: true,
      });
      continue;
    }

    const newVisited = new Set(visited);
    newVisited.add(depName);

    dependencies.push({
      name: depName,
      version: depInfo.version,
      children: resolveDependencyTree(depName, packages, newVisited),
      isCircular: false,
    });
  }

  return dependencies;
}

export function countTotalDependencies(nodes: DependencyNode[]): number {
  let count = nodes.length;
  for (const node of nodes) {
    if (!node.isCircular) {
      count += countTotalDependencies(node.children);
    }
  }
  return count;
}

/**
 * Builds a reverse-dependency index: maps a package name to the sorted list of
 * package names that directly declare it as a dependency.
 */
export function buildReverseDependencyIndex(packages: PackageSite): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const [name, pkg] of Object.entries(packages)) {
    if (!pkg.deps) continue;
    for (const depName of Object.keys(pkg.deps)) {
      let dependents = index.get(depName);
      if (!dependents) {
        dependents = [];
        index.set(depName, dependents);
      }
      dependents.push(name);
    }
  }

  for (const dependents of index.values()) {
    dependents.sort((a, b) => a.localeCompare(b));
  }

  return index;
}

/**
 * Resolves a tree of packages that depend (directly and transitively) on the
 * given package. Cycles are marked instead of being expanded.
 */
export function resolveReverseDependencyTree(
  packageName: string,
  reverseIndex: Map<string, string[]>,
  packages: PackageSite,
  visited: Set<string> = new Set()
): DependencyNode[] {
  const dependents = reverseIndex.get(packageName);
  if (!dependents || dependents.length === 0) {
    return [];
  }

  const nodes: DependencyNode[] = [];

  for (const depName of dependents) {
    const version = packages[depName]?.version || '';

    if (visited.has(depName)) {
      nodes.push({ name: depName, version, children: [], isCircular: true });
      continue;
    }

    const newVisited = new Set(visited);
    newVisited.add(depName);

    nodes.push({
      name: depName,
      version,
      children: resolveReverseDependencyTree(depName, reverseIndex, packages, newVisited),
      isCircular: false,
    });
  }

  return nodes;
}

/**
 * Collects the full set of packages that transitively depend on the given
 * package (the reverse-dependency closure), excluding the package itself.
 */
export function collectReverseDependencyClosure(
  packageName: string,
  reverseIndex: Map<string, string[]>,
  collected: Set<string> = new Set()
): Set<string> {
  const dependents = reverseIndex.get(packageName);
  if (!dependents) return collected;

  for (const depName of dependents) {
    if (!collected.has(depName)) {
      collected.add(depName);
      collectReverseDependencyClosure(depName, reverseIndex, collected);
    }
  }

  return collected;
}

/**
 * Computes the impact of updating a package between two builds: which packages
 * depend on it (directly and transitively) and whether those dependents also
 * changed between the two builds.
 */
export function analyzeUpdateImpact(
  packageName: string,
  buildIdA: string,
  buildIdB: string,
  reverseIndex: Map<string, string[]>,
  history: PackageHistory
): ImpactResult {
  const versionsForBuild = (name: string) => ({
    a: history.packages[name]?.versions[buildIdA] || null,
    b: history.packages[name]?.versions[buildIdB] || null,
  });

  const self = versionsForBuild(packageName);

  const directNames = new Set(reverseIndex.get(packageName) || []);
  const transitiveNames = collectReverseDependencyClosure(packageName, reverseIndex);

  const toDependent = (name: string): ImpactDependent => {
    const v = versionsForBuild(name);
    return {
      name,
      versionA: v.a,
      versionB: v.b,
      changed: v.a !== v.b,
      direct: directNames.has(name),
    };
  };

  const dependents = Array.from(transitiveNames)
    .map(toDependent)
    .sort((a, b) => {
      // direct dependents first, then by name
      if (a.direct !== b.direct) return a.direct ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return {
    packageName,
    versionA: self.a,
    versionB: self.b,
    changed: self.a !== self.b,
    directDependents: dependents.filter(d => d.direct),
    transitiveDependents: dependents,
    transitiveCount: dependents.length,
  };
}
