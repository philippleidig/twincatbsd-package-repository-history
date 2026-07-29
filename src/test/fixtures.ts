import { vi } from 'vitest';
import { Package, PackageHistory, PackageSite } from '../types/package';

export function makePackage(name: string, overrides: Partial<Package> = {}): Package {
  return {
    name,
    origin: `devel/${name}`,
    version: '1.0.0',
    comment: `${name} test package`,
    maintainer: 'ports@example.org',
    www: `https://example.org/${name}`,
    abi: 'FreeBSD:14:amd64',
    arch: 'freebsd:14:x86:64',
    prefix: '/usr/local',
    sum: 'deadbeef',
    flatsize: 1024,
    path: `All/${name}-1.0.0.pkg`,
    repopath: `All/${name}-1.0.0.pkg`,
    licenselogic: 'single',
    licenses: ['BSD2CLAUSE'],
    pkgsize: 512,
    desc: `${name} long description`,
    categories: ['devel'],
    ...overrides,
  };
}

export const packageSite: PackageSite = {
  gtk3: makePackage('gtk3', {
    version: '3.24.43',
    comment: 'Gimp Toolkit for X11 GUI',
    deps: {
      glib: { origin: 'devel/glib', version: '2.80.0' },
      cairo: { origin: 'graphics/cairo', version: '1.18.0' },
    },
  }),
  glib: makePackage('glib', { version: '2.80.0' }),
  cairo: makePackage('cairo', { version: '1.18.0' }),
  vim: makePackage('vim', {
    version: '9.1.0',
    deps: { gtk3: { origin: 'x11-toolkits/gtk3', version: '3.24.43' } },
  }),
};

export const packageHistory: PackageHistory = {
  builds: {
    '347903': {
      release_date: '2026-05-21',
      freebsd_version: '14.4-RELEASE-p5',
      packages_count: 1859,
      update_date: '2026-07-10',
    },
    '334630': {
      release_date: '2026-05-29',
      freebsd_version: '14.4-RELEASE-p5',
      packages_count: 1798,
      update_date: '2026-06-10',
    },
  },
  packages: {
    gtk3: { versions: { '347903': '3.24.43', '334630': '3.24.42' } },
    glib: { versions: { '347903': '2.80.0', '334630': '2.80.0' } },
    cairo: { versions: { '347903': '1.18.0' } },
    vim: { versions: { '347903': '9.1.0', '334630': '9.1.0' } },
  },
};

/** Serve the fixtures to `usePackageData` without touching the network. */
export function mockPackageDataFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes('packagehistory') ? packageHistory : packageSite;
    return {
      ok: true,
      status: 200,
      json: async () => body,
    } as Response;
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
