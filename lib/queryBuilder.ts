/**
 * Parses natural language input to build an optimized LinkedIn search query.
 */
export function buildSearchQuery(rawInput: string): string {
  const input = rawInput.toLowerCase().trim();
  const parts: string[] = ['site:linkedin.com/in'];

  // 1. Extract Availability
  const availabilityRegex = /\b(open to work|actively looking|open for opportunities|available)\b/gi;
  let hasAvailability = false;
  if (availabilityRegex.test(input)) {
    hasAvailability = true;
    parts.push('"open to work"');
  }

  // Remove availability phrase to make subsequent parsing cleaner
  let cleanedInput = input.replace(availabilityRegex, '');

  // 2. Extract Location
  // Patterns like: "in bangalore", "based in new york", "located in london", "remote"
  const locationPrefixRegex = /\b(?:in|based in|located in|near)\s+([a-z\s]+?)(?:\s+(?:with|for|having|open|remote|\d)|$)/gi;
  let location: string | null = null;

  const locMatch = locationPrefixRegex.exec(cleanedInput);
  if (locMatch) {
    location = locMatch[1].trim();
    // Filter out some false positives like "years", "year", "developer", "engineer"
    const stopWords = ['years', 'year', 'developer', 'engineer', 'dev', 'ml', 'ai'];
    if (stopWords.includes(location) || location.split(/\s+/).some(w => stopWords.includes(w))) {
      location = null;
    }
  }

  // If "remote" is explicitly in the input, ensure "remote" is included
  const hasRemote = /\bremote\b/i.test(cleanedInput);
  if (hasRemote) {
    parts.push('"remote"');
  }

  // Clean the location phrase from input
  if (location) {
    parts.push(`"${location}"`);
    cleanedInput = cleanedInput.replace(new RegExp(`\\b(?:in|based in|located in|near)\\s+${escapeRegExp(location)}`, 'i'), '');
  }

  // 3. Extract Years of Experience
  // Match patterns like: "5 year", "3+ years", "3 years", "3+ yrs"
  const yearsRegex = /(\d+)\s*\+?\s*(?:year|yr|yrs|years)/gi;
  const yearsMatch = yearsRegex.exec(cleanedInput);
  if (yearsMatch) {
    const num = parseInt(yearsMatch[1], 10);
    const hasPlus = yearsMatch[0].includes('+');
    if (hasPlus || num <= 3) {
      // e.g. 3+ years -> ("3 years" OR "3+ years" OR "4 years" OR "5 years")
      parts.push(`("${num} years" OR "${num}+ years" OR "${num + 1} years" OR "${num + 2} years")`);
    } else {
      // e.g. 5 year -> ("5 years" OR "5+ years")
      parts.push(`("${num} years" OR "${num}+ years")`);
    }
    // Remove the years phrase
    cleanedInput = cleanedInput.replace(yearsRegex, '');
  }

  // 4. Extract Skills & Aliases
  // Split the rest of the query into keywords
  const words = cleanedInput
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1);

  const skillAliases: { [key: string]: string[] } = {
    'js': ['javascript'],
    'ts': ['typescript'],
    'node': ['node.js', 'nodejs'],
    'nodejs': ['node.js', 'nodejs'],
    'ml': ['machine learning'],
    'ai': ['artificial intelligence'],
    'devops': ['devops', 'dev ops'],
    'fullstack': ['full stack', 'fullstack'],
    'react': ['react'],
    'reactnative': ['react native'],
    'python': ['python'],
    'java': ['java'],
    'mongodb': ['mongodb'],
    'aws': ['aws', 'amazon web services'],
    'gcp': ['gcp', 'google cloud'],
    'azure': ['azure'],
    'kubernetes': ['kubernetes', 'k8s'],
    'docker': ['docker'],
  };

  const processedWords = new Set<string>();

  // Check compound phrases first (like "react native" or "machine learning" or "full stack")
  const rawCleanedForCompound = cleanedInput.replace(/\s+/g, ' ');
  if (/\breact\s+native\b/i.test(rawCleanedForCompound)) {
    parts.push('"react native"');
    processedWords.add('react');
    processedWords.add('native');
  }
  if (/\bmachine\s+learning\b/i.test(rawCleanedForCompound)) {
    parts.push('"machine learning"');
    processedWords.add('machine');
    processedWords.add('learning');
  }
  if (/\bartificial\s+intelligence\b/i.test(rawCleanedForCompound)) {
    parts.push('"artificial intelligence"');
    processedWords.add('artificial');
    processedWords.add('intelligence');
  }
  if (/\bfull\s+stack\b/i.test(rawCleanedForCompound)) {
    parts.push('("full stack" OR "fullstack")');
    processedWords.add('full');
    processedWords.add('stack');
    processedWords.add('fullstack');
  }

  // Stop words to filter out from pure skills list
  const stopWords = new Set([
    'developer', 'engineer', 'recruiter', 'search', 'find', 'hire', 'candidate', 
    'looking', 'work', 'open', 'for', 'with', 'having', 'experience', 'senior', 
    'junior', 'mid', 'lead', 'staff', 'principal', 'role', 'job', 'need', 'want',
    'remote', 'hybrid', 'office', 'contract', 'freelance', 'parttime', 'fulltime',
    'in', 'at', 'based', 'located', 'near'
  ]);

  // Check for "senior", "junior", "lead"
  if (/\bsenior\b/i.test(cleanedInput)) {
    parts.push('"senior"');
    processedWords.add('senior');
  }
  if (/\blead\b/i.test(cleanedInput)) {
    parts.push('"lead"');
    processedWords.add('lead');
  }
  if (/\bjunior\b/i.test(cleanedInput)) {
    parts.push('"junior"');
    processedWords.add('junior');
  }

  for (const word of words) {
    if (processedWords.has(word) || stopWords.has(word)) {
      continue;
    }

    if (skillAliases[word]) {
      const expansion = skillAliases[word];
      if (expansion.length === 1) {
        parts.push(`"${expansion[0]}"`);
      } else {
        const orClause = expansion.map(s => `"${s}"`).join(' OR ');
        parts.push(`(${orClause})`);
      }
      processedWords.add(word);
    } else {
      parts.push(`"${word}"`);
      processedWords.add(word);
    }
  }

  return parts.join(' ');
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
