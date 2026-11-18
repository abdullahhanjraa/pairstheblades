export interface SearchableProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  tags?: string;
  price: number;
  compareAtPrice?: number | null;
  featuredImage: string;
  images?: string[];
  variants?: Array<{
    id: string;
    option1: string;
    price: number;
    inventoryQuantity: number;
  }>;
}

/**
 * Damerau-Levenshtein edit distance (handles insertions, deletions, substitutions,
 * and adjacent character swaps like "knfie" -> "knife" or "damscus" -> "damascus").
 */
function damerauLevenshtein(a: string, b: string, maxDist = 2): number {
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1;
  if (a === b) return 0;

  const d: number[][] = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));
  for (let i = 0; i <= lenA; i++) d[i][0] = i;
  for (let j = 0; j <= lenB; j++) d[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    let rowMin = maxDist + 1;
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, d[i - 2][j - 2] + 1); // transposition
      }
      d[i][j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }

  return d[lenA][lenB];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const clean = normalize(text);
  return clean ? clean.split(' ') : [];
}

function maxTypoDistance(tokenLength: number): number {
  if (tokenLength <= 3) return 0;
  if (tokenLength <= 6) return 1;
  return 2;
}

function scoreTokenAgainstWords(token: string, words: string[], exactWeight: number, fuzzyWeight: number): number {
  let best = 0;
  const maxDist = maxTypoDistance(token.length);

  for (const word of words) {
    if (word === token) {
      return exactWeight;
    }
    if (word.startsWith(token)) {
      best = Math.max(best, Math.round(exactWeight * 0.9));
      continue;
    }
    if (token.length >= 3 && word.includes(token)) {
      best = Math.max(best, Math.round(exactWeight * 0.78));
      continue;
    }
    if (maxDist > 0 && word.length >= 3) {
      const dist = damerauLevenshtein(token, word, maxDist);
      if (dist <= maxDist) {
        const penalty = dist === 1 ? 1 : 0.75;
        best = Math.max(best, Math.round(fuzzyWeight * penalty));
      }
    }
  }

  return best;
}

/**
 * Smart, case-insensitive, typo-tolerant ranked product search.
 * Runs in < 1ms for typical catalogs — works identically on server and client.
 */
export function smartSearchProducts<T extends SearchableProduct>(products: T[], rawQuery: string): T[] {
  const cleanQuery = normalize(rawQuery);
  if (!cleanQuery) return products;

  const queryTokens = cleanQuery.split(' ').filter(Boolean);
  if (queryTokens.length === 0) return products;

  const scored: Array<{ product: T; score: number }> = [];

  for (const product of products) {
    const normTitle = normalize(product.title || '');
    const normHandle = normalize((product.handle || '').replace(/-/g, ' '));
    const normDesc = normalize(product.description || '');
    const normTags = normalize(product.tags || '');

    const titleWords = tokenize(normTitle);
    const handleWords = tokenize(normHandle);
    const tagWords = tokenize(normTags);
    const descWords = tokenize(normDesc);

    let totalScore = 0;
    let matchedTokens = 0;

    // Exact phrase boost
    if (normTitle === cleanQuery) {
      totalScore += 150;
    } else if (normTitle.includes(cleanQuery)) {
      totalScore += 95;
    } else if (normDesc.includes(cleanQuery) || normHandle.includes(cleanQuery)) {
      totalScore += 45;
    }

    for (const token of queryTokens) {
      const titleScore = scoreTokenAgainstWords(token, titleWords, 55, 36);
      const handleScore = scoreTokenAgainstWords(token, handleWords, 35, 22);
      const tagScore = scoreTokenAgainstWords(token, tagWords, 30, 18);
      const descScore = scoreTokenAgainstWords(token, descWords, 18, 10);

      const bestTokenScore = Math.max(titleScore, handleScore, tagScore, descScore);
      if (bestTokenScore > 0) {
        matchedTokens++;
        totalScore += bestTokenScore;
      }
    }

    // Require all tokens to match for 1-2 word queries; at least 60% for 3+ word queries
    const minRequired = queryTokens.length <= 2 ? queryTokens.length : Math.ceil(queryTokens.length * 0.6);
    if (matchedTokens >= minRequired && totalScore > 0) {
      scored.push({ product, score: totalScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.product);
}
