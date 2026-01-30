export interface PackageDependency {
  origin: string;
  version: string;
}

export interface Package {
  name: string;
  origin: string;
  version: string;
  comment: string;
  maintainer: string;
  www: string;
  abi: string;
  arch: string;
  prefix: string;
  sum: string;
  flatsize: number;
  path: string;
  repopath: string;
  licenselogic: string;
  licenses: string[];
  pkgsize: number;
  desc: string;
  deps?: Record<string, PackageDependency>;
  categories: string[];
  shlibs_required?: string[];
  shlibs_provided?: string[];
  annotations?: Record<string, string>;
}

export interface PackageSite {
  [packageName: string]: Package;
}

export interface BuildInfo {
  release_date: string;
  freebsd_version: string;
  packages_count: string | number;
  update_date: string;
}

export interface PackageVersions {
  versions: Record<string, string>;
}

export interface PackageHistory {
  builds: Record<string, BuildInfo>;
  packages: Record<string, PackageVersions>;
}

export interface DependencyNode {
  name: string;
  version: string;
  children: DependencyNode[];
  isCircular?: boolean;
}
