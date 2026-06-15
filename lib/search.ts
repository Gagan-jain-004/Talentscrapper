import { buildSearchQuery } from './queryBuilder';
import { providerMap, SearchResult } from './searchProviders';
import { getSortedProvidersByQuota, incrementUsage } from './usageTracker';
import { SearchHistory } from './models/SearchHistory';
import { connectDB } from './mongodb';

export interface ExecuteSearchResponse {
  results: SearchResult[];
  providerUsed: string;
  builtQuery: string;
}

export async function executeSearch(rawQuery: string): Promise<ExecuteSearchResponse> {
  const builtQuery = buildSearchQuery(rawQuery);
  const providers = ['brave', 'serpapi', 'scaleserp', 'valueserp', 'zenserp'];

  // Sort providers based on remaining monthly quotas
  const sorted = await getSortedProvidersByQuota(providers);

  if (sorted.length === 0) {
    throw new Error('NO_CONFIGURED_PROVIDERS');
  }

  for (const provider of sorted) {
    try {
      const searchFn = providerMap[provider];
      if (!searchFn) continue;

      // Execute search using the compiled query
      const results = await searchFn(builtQuery);

      // If results are found, increment usage, save history, and return results.
      // Otherwise, fall back to the next available provider.
      if (results && results.length > 0) {
        await incrementUsage(provider);

        await connectDB();
        await SearchHistory.create({
          query: rawQuery,
          builtQuery: builtQuery,
          providerUsed: provider,
          resultsCount: results.length,
          searchedAt: new Date(),
        });

        return {
          results,
          providerUsed: provider,
          builtQuery,
        };
      }
    } catch (error: any) {
      console.error(`Search provider '${provider}' failed:`, error.message || error);
      // Fallback: try the next provider
      continue;
    }
  }

  throw new Error('ALL_QUOTA_EXHAUSTED_OR_NO_RESULTS');
}
