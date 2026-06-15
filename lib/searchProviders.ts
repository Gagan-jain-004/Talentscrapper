export interface SearchResult {
  name: string;
  profileUrl: string;
  headline: string;
  location: string;
  snippet: string;
  relevanceScore: number;
}

/**
 * Normalizes title into Name and Headline
 */
function normalizeLinkedInTitle(title: string): { name: string; headline: string } {
  // Remove " | LinkedIn", " - LinkedIn", etc.
  let titleClean = title
    .replace(/\s*\|\s*LinkedIn/gi, '')
    .replace(/\s*-\s*LinkedIn/gi, '')
    .replace(/\s*\|\s*Professional Profile/gi, '')
    .trim();

  let name = '';
  let headline = '';

  const firstDash = titleClean.indexOf('-');
  if (firstDash !== -1) {
    name = titleClean.substring(0, firstDash).trim();
    headline = titleClean.substring(firstDash + 1).trim();
  } else {
    const firstPipe = titleClean.indexOf('|');
    if (firstPipe !== -1) {
      name = titleClean.substring(0, firstPipe).trim();
      headline = titleClean.substring(firstPipe + 1).trim();
    } else {
      name = titleClean;
      headline = '';
    }
  }

  // Clean name from trailing/leading punctuation
  name = name.replace(/^[,.\s]+|[,.\s]+$/g, '');
  if (!headline) {
    headline = 'LinkedIn Professional';
  }

  return { name, headline };
}

/**
 * Extracts location from snippet
 */
function extractLocation(snippet: string): string {
  if (!snippet) return 'Unknown';

  const areaMatch = snippet.match(/\b(greater\s+[a-zA-Z\s]+?\s+area)\b/i);
  if (areaMatch) {
    return capitalizeWords(areaMatch[1].trim());
  }

  const inMatch = snippet.match(/\b(?:lives in|based in|located in|from)\s+([A-Z][a-zA-Z\s]+?)(?:\.|\b)/);
  if (inMatch) {
    return capitalizeWords(inMatch[1].trim());
  }

  // Pattern: City, State/Country (e.g. "Bengaluru, Karnataka, India" or "New York, NY")
  const commaMatch = snippet.match(/\b([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*,\s*[A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*(?:,\s*[A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*)?)\b/);
  if (commaMatch) {
    return commaMatch[1].trim();
  }

  // Look for common locations (cities) in snippet
  const locations = ['bangalore', 'bengaluru', 'mumbai', 'pune', 'delhi', 'hyderabad', 'chennai', 'noida', 'gurgaon', 'new york', 'san francisco', 'london', 'toronto', 'sydney', 'berlin', 'paris', 'singapore'];
  for (const loc of locations) {
    if (snippet.toLowerCase().includes(loc)) {
      return capitalizeWords(loc);
    }
  }

  return 'Remote / Unknown';
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Calculates a relevance score from 1 to 10
 */
function calculateRelevance(title: string, snippet: string, query: string): number {
  const combined = `${title} ${snippet}`.toLowerCase();
  const qClean = query.toLowerCase();

  let score = 1;

  // 1. Keyword matches (max 5 points)
  const queryWords = qClean
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['site', 'linkedin', 'com', 'and', 'the', 'for', 'with', 'open', 'work'].includes(w));

  let keywordMatches = 0;
  for (const word of queryWords) {
    if (combined.includes(word)) {
      keywordMatches++;
    }
  }
  score += Math.min(keywordMatches, 5);

  // 2. Open to Work (+2 points)
  if (combined.includes('open to work') || combined.includes('actively looking') || combined.includes('open for opportunities')) {
    score += 2;
  }

  // 3. Experience years match (+2 points)
  const yearsInQuery = qClean.match(/(\d+)\s*(?:year|yr|yrs|years)/i);
  if (yearsInQuery) {
    const yearsNum = yearsInQuery[1];
    const yrRegex = new RegExp(`\\b${yearsNum}\\+?\\s*(?:year|yr|yrs|years)\\b`, 'i');
    if (yrRegex.test(combined)) {
      score += 2;
    }
  }

  // 4. Location match (+1 point)
  const locInQuery = qClean.match(/\b(?:in|based in|located in|near)\s+([a-z]+)/i);
  if (locInQuery) {
    const locWord = locInQuery[1];
    if (combined.includes(locWord)) {
      score += 1;
    }
  }

  return Math.min(score, 10);
}

/**
 * Checks if a URL is a valid LinkedIn profile URL
 */
function isValidLinkedInUrl(url: string): boolean {
  if (!url) return false;
  // Match: linkedin.com/in/profile-name
  return /linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i.test(url);
}

/**
 * Normalizes a LinkedIn profile URL (removes language prefixes or extra parameters)
 */
function normalizeLinkedInUrl(url: string): string {
  let cleanUrl = url.trim();
  // Ensure starts with https://
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }
  try {
    const parsed = new URL(cleanUrl);
    // Remove query params
    parsed.search = '';
    parsed.hash = '';
    // Normalize localized subdomains like in.linkedin.com to www.linkedin.com
    if (parsed.hostname.endsWith('linkedin.com')) {
      parsed.hostname = 'www.linkedin.com';
    }
    return parsed.toString();
  } catch (e) {
    return cleanUrl;
  }
}

// ==========================================
// 1. BRAVE SEARCH
// ==========================================
export async function searchBrave(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_KEY;
  if (!apiKey) throw new Error('BRAVE_SEARCH_KEY_MISSING');

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&search_lang=en`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave Search failed with status: ${response.status}`);
  }

  const data = await response.json();
  const results = data.web?.results || [];

  return results
    .filter((res: any) => isValidLinkedInUrl(res.url))
    .map((res: any) => {
      const { name, headline } = normalizeLinkedInTitle(res.title);
      return {
        name,
        profileUrl: normalizeLinkedInUrl(res.url),
        headline,
        location: extractLocation(res.description),
        snippet: res.description || '',
        relevanceScore: calculateRelevance(res.title, res.description || '', query),
      };
    });
}

// ==========================================
// 2. SERPAPI
// ==========================================
export async function searchSerpApi(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY_MISSING');

  const url = `https://serpapi.com/search.json?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&engine=google&num=10&hl=en`;

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`SerpAPI failed with status: ${response.status}`);
  }

  const data = await response.json();
  const results = data.organic_results || [];

  return results
    .filter((res: any) => isValidLinkedInUrl(res.link))
    .map((res: any) => {
      const { name, headline } = normalizeLinkedInTitle(res.title);
      return {
        name,
        profileUrl: normalizeLinkedInUrl(res.link),
        headline,
        location: extractLocation(res.snippet),
        snippet: res.snippet || '',
        relevanceScore: calculateRelevance(res.title, res.snippet || '', query),
      };
    });
}

// ==========================================
// 3. SCALESERP
// ==========================================
export async function searchScaleSerp(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SCALESERP_KEY;
  if (!apiKey) throw new Error('SCALESERP_KEY_MISSING');

  const url = `https://api.scaleserp.com/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&num=10`;

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`ScaleSerp failed with status: ${response.status}`);
  }

  const data = await response.json();
  const results = data.organic_results || [];

  return results
    .filter((res: any) => isValidLinkedInUrl(res.link))
    .map((res: any) => {
      const { name, headline } = normalizeLinkedInTitle(res.title);
      return {
        name,
        profileUrl: normalizeLinkedInUrl(res.link),
        headline,
        location: extractLocation(res.snippet),
        snippet: res.snippet || '',
        relevanceScore: calculateRelevance(res.title, res.snippet || '', query),
      };
    });
}

// ==========================================
// 4. VALUESERP
// ==========================================
export async function searchValueSerp(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.VALUESERP_KEY;
  if (!apiKey) throw new Error('VALUESERP_KEY_MISSING');

  const url = `https://api.valueserp.com/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&num=10`;

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`ValueSerp failed with status: ${response.status}`);
  }

  const data = await response.json();
  const results = data.organic_results || [];

  return results
    .filter((res: any) => isValidLinkedInUrl(res.link))
    .map((res: any) => {
      const { name, headline } = normalizeLinkedInTitle(res.title);
      return {
        name,
        profileUrl: normalizeLinkedInUrl(res.link),
        headline,
        location: extractLocation(res.snippet),
        snippet: res.snippet || '',
        relevanceScore: calculateRelevance(res.title, res.snippet || '', query),
      };
    });
}

// ==========================================
// 5. ZENSERP
// ==========================================
export async function searchZenserp(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.ZENSERP_KEY;
  if (!apiKey) throw new Error('ZENSERP_KEY_MISSING');

  const url = `https://app.zenserp.com/api/v2/search?q=${encodeURIComponent(query)}&num=10`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Zenserp failed with status: ${response.status}`);
  }

  const data = await response.json();
  const results = data.organic || [];

  return results
    .filter((res: any) => isValidLinkedInUrl(res.link))
    .map((res: any) => {
      const { name, headline } = normalizeLinkedInTitle(res.title);
      return {
        name,
        profileUrl: normalizeLinkedInUrl(res.link),
        headline,
        location: extractLocation(res.description),
        snippet: res.description || '',
        relevanceScore: calculateRelevance(res.title, res.description || '', query),
      };
    });
}

/**
 * Map provider names to search functions
 */
export const providerMap: { [key: string]: (query: string) => Promise<SearchResult[]> } = {
  brave: searchBrave,
  serpapi: searchSerpApi,
  scaleserp: searchScaleSerp,
  valueserp: searchValueSerp,
  zenserp: searchZenserp,
};
