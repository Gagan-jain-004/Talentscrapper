import { connectDB } from './mongodb';
import { Usage } from './models/Usage';

export const PROVIDER_LIMITS: { [key: string]: number } = {
  brave: 2000,
  serpapi: 100,
  scaleserp: 100,
  valueserp: 100,
  zenserp: 100,
};

export function getProviderKeys(): { [key: string]: string | undefined } {
  return {
    brave: process.env.BRAVE_SEARCH_KEY,
    serpapi: process.env.SERPAPI_KEY,
    scaleserp: process.env.SCALESERP_KEY,
    valueserp: process.env.VALUESERP_KEY,
    zenserp: process.env.ZENSERP_KEY,
  };
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getUsage() {
  await connectDB();
  const currentMonth = getCurrentMonth();

  let usage = await Usage.findOne({ month: currentMonth });
  if (!usage) {
    try {
      usage = await Usage.create({
        month: currentMonth,
        providers: { brave: 0, serpapi: 0, scaleserp: 0, valueserp: 0, zenserp: 0 },
        totalSearches: 0,
        lastUpdated: new Date(),
      });
    } catch (e: any) {
      // In case of parallel creations, check if it was created in the meantime
      if (e.code === 11000) {
        usage = await Usage.findOne({ month: currentMonth });
      } else {
        throw e;
      }
    }
  }
  return usage!;
}

export async function incrementUsage(provider: string) {
  await connectDB();
  const currentMonth = getCurrentMonth();
  const updateField = `providers.${provider}`;

  await Usage.updateOne(
    { month: currentMonth },
    {
      $inc: {
        [updateField]: 1,
        totalSearches: 1,
      },
      $set: { lastUpdated: new Date() },
    },
    { upsert: true }
  );
}

export async function getSortedProvidersByQuota(providers: string[]): Promise<string[]> {
  const usage = await getUsage();
  const keys = getProviderKeys();

  const list = providers
    .filter((provider) => {
      // Exclude provider if the corresponding key is missing in environment variables
      const key = keys[provider];
      return typeof key === 'string' && key.trim().length > 0;
    })
    .map((provider) => {
      const used = (usage.providers as any)[provider] || 0;
      const limit = PROVIDER_LIMITS[provider] || 100;
      const remaining = Math.max(0, limit - used);
      return { provider, remaining };
    });

  // Sort preference: Brave first (highest limit), then others in order
  const preference = ['brave', 'serpapi', 'scaleserp', 'valueserp', 'zenserp'];

  list.sort((a, b) => {
    if (b.remaining !== a.remaining) {
      return b.remaining - a.remaining; // Descending remaining quota
    }
    return preference.indexOf(a.provider) - preference.indexOf(b.provider); // Preference order tie-breaker
  });

  return list.map((item) => item.provider);
}
