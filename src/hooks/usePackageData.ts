import { useState, useEffect } from 'react';
import { PackageSite, PackageHistory } from '../types/package';

interface UsePackageDataResult {
  packageSite: PackageSite | null;
  packageHistory: PackageHistory | null;
  loading: boolean;
  error: string | null;
}

export function usePackageData(): UsePackageDataResult {
  const [packageSite, setPackageSite] = useState<PackageSite | null>(null);
  const [packageHistory, setPackageHistory] = useState<PackageHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const baseUrl = import.meta.env.DEV
          ? '..'
          : 'https://raw.githubusercontent.com/philippleidig/twincatbsd-package-repository-history/main';

        const [siteResponse, historyResponse] = await Promise.all([
          fetch(`${baseUrl}/packagesite.json`),
          fetch(`${baseUrl}/packagehistory.json`),
        ]);

        if (!siteResponse.ok) {
          throw new Error(`Failed to fetch packagesite.json: ${siteResponse.status}`);
        }
        if (!historyResponse.ok) {
          throw new Error(`Failed to fetch packagehistory.json: ${historyResponse.status}`);
        }

        const [siteData, historyData] = await Promise.all([
          siteResponse.json(),
          historyResponse.json(),
        ]);

        setPackageSite(siteData);
        setPackageHistory(historyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { packageSite, packageHistory, loading, error };
}
