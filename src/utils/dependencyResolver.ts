import { PackageSite, DependencyNode } from '../types/package';

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
