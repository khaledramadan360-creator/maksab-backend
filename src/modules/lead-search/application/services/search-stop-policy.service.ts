export class SearchStopPolicyService {
  /**
   * Shared cross-platform rule:
   * once filtering has produced the requested accepted results, we stop early.
   */
  public getFilterStopTarget(requestedCount: number): number {
    return Math.max(0, requestedCount);
  }

  public getAcceptedCount(...acceptedPoolSizes: number[]): number {
    return acceptedPoolSizes.reduce((total, size) => total + Math.max(0, size), 0);
  }

  public getMaxPagesPerQuery(requestedCount: number): number {
    if (requestedCount <= 10) return 5;
    if (requestedCount <= 25) return 8;
    return 12;
  }

  public shouldStopFiltering(acceptedCount: number, requestedCount: number): boolean {
    return acceptedCount >= this.getFilterStopTarget(requestedCount);
  }
}
