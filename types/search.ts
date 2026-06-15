export interface SearchResultType {
  name: string;
  profileUrl: string;
  headline: string;
  location: string;
  snippet: string;
  relevanceScore: number;
}

export interface SearchHistoryType {
  _id: string;
  query: string;
  builtQuery: string;
  providerUsed: string;
  resultsCount: number;
  searchedAt: string;
}

export interface UsageProviderBreakdown {
  provider: string;
  used: number;
  limit: number;
  percentage: number;
}

export interface UsageType {
  month: string;
  totalSearches: number;
  lastUpdated: string;
  providers: UsageProviderBreakdown[];
}
