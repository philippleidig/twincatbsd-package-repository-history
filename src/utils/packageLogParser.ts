import { ParsedPackage, PackageCheckResult, PackageHistory, BuildCompareResult } from '../types/package';

export function parsePackageLog(content: string): ParsedPackage[] {
  const lines = content.split(/\r?\n/);
  const packages: ParsedPackage[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: "PackageName-Version    Description"
    // Split into name-version token and description by whitespace
    const match = trimmed.match(/^(\S+)\s+(.*)/);
    if (!match) continue;

    const nameVersion = match[1];
    const description = match[2].trim();

    // Split on the last '-' to separate package name from version
    const lastDash = nameVersion.lastIndexOf('-');
    if (lastDash <= 0) continue;

    const name = nameVersion.substring(0, lastDash);
    const version = nameVersion.substring(lastDash + 1);

    if (!name || !version) continue;

    packages.push({ name, version, description });
  }

  return packages;
}

export function detectBuild(packages: ParsedPackage[], history: PackageHistory): string | null {
  // Look for os-release-bhf package which contains the build number in its version
  // e.g. version "14.3.7.0_275264" -> build "275264"
  const osRelease = packages.find(p => p.name === 'os-release-bhf');
  if (!osRelease) return null;

  // Extract build number: it's the part after the last '_'
  const underscoreIdx = osRelease.version.lastIndexOf('_');
  if (underscoreIdx === -1) return null;

  const buildCandidate = osRelease.version.substring(underscoreIdx + 1);

  // Verify this build exists in history
  if (history.builds[buildCandidate]) {
    return buildCandidate;
  }

  return null;
}

export function analyzePackages(
  parsed: ParsedPackage[],
  buildId: string,
  history: PackageHistory
): PackageCheckResult[] {
  return parsed.map(pkg => {
    const historyEntry = history.packages[pkg.name];

    if (!historyEntry) {
      return {
        name: pkg.name,
        installedVersion: pkg.version,
        expectedVersion: null,
        status: 'not_found' as const,
        description: pkg.description,
      };
    }

    const expectedVersion = historyEntry.versions[buildId] || null;

    if (!expectedVersion) {
      return {
        name: pkg.name,
        installedVersion: pkg.version,
        expectedVersion: null,
        status: 'not_found' as const,
        description: pkg.description,
      };
    }

    const status = pkg.version === expectedVersion ? 'match' as const : 'mismatch' as const;

    return {
      name: pkg.name,
      installedVersion: pkg.version,
      expectedVersion,
      status,
      description: pkg.description,
    };
  });
}

export function compareBuilds(
  buildIdA: string,
  buildIdB: string,
  history: PackageHistory
): BuildCompareResult[] {
  const results: BuildCompareResult[] = [];

  for (const [pkgName, pkg] of Object.entries(history.packages)) {
    const versionA = pkg.versions[buildIdA] || null;
    const versionB = pkg.versions[buildIdB] || null;

    if (versionA && !versionB) {
      results.push({ name: pkgName, status: 'deleted', versionA, versionB });
    } else if (!versionA && versionB) {
      results.push({ name: pkgName, status: 'added', versionA, versionB });
    } else if (versionA && versionB && versionA !== versionB) {
      results.push({ name: pkgName, status: 'modified', versionA, versionB });
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}
