import { CandidateResult } from '../../domain/entities';
import { RankingContext, ResultRanker } from '../../domain/repositories';

export interface CandidateBuckets {
  strictAccepted: CandidateResult[];
  relaxedAccepted: CandidateResult[];
  fallbackAccepted: CandidateResult[];
}

interface AddBucketCandidatesToPoolInput {
  targetPool: Map<string, CandidateResult>;
  candidates: CandidateResult[];
  ranker: ResultRanker;
  rankingContext: RankingContext;
  blockIfExistsIn?: Array<Map<string, CandidateResult>>;
  removeFrom?: Array<Map<string, CandidateResult>>;
}

interface BuildBestCandidatesFromPoolsInput {
  requestedCount: number;
  ranker: ResultRanker;
  rankingContext: RankingContext;
  strictPool: Map<string, CandidateResult>;
  relaxedPool: Map<string, CandidateResult>;
  fallbackPool: Map<string, CandidateResult>;
}

export function addBucketCandidatesToPool(input: AddBucketCandidatesToPoolInput): void {
  if (!input.candidates.length) {
    return;
  }

  const rankedCandidates = input.ranker.rank(input.candidates, input.rankingContext);

  for (const candidate of rankedCandidates) {
    if (input.blockIfExistsIn?.some(pool => pool.has(candidate.canonicalUrl))) {
      continue;
    }

    const existing = input.targetPool.get(candidate.canonicalUrl);
    if (!existing || candidate.score > existing.score) {
      input.targetPool.set(candidate.canonicalUrl, candidate);
    }

    for (const pool of input.removeFrom || []) {
      pool.delete(candidate.canonicalUrl);
    }
  }
}

export function buildBestCandidatesFromPools(
  input: BuildBestCandidatesFromPoolsInput
): CandidateResult[] {
  const selected: CandidateResult[] = [];
  const seen = new Set<string>();
  const orderedPools = [input.strictPool, input.relaxedPool, input.fallbackPool];

  for (const pool of orderedPools) {
    const rankedPoolCandidates = input.ranker.rank(Array.from(pool.values()), input.rankingContext);

    for (const candidate of rankedPoolCandidates) {
      if (seen.has(candidate.canonicalUrl)) {
        continue;
      }

      selected.push(candidate);
      seen.add(candidate.canonicalUrl);

      if (selected.length >= input.requestedCount) {
        return selected;
      }
    }
  }

  return selected;
}
