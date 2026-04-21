export class SearchStopPolicyService {
  /**
   * Shared cross-platform rule:
   * once filtering has produced the requested accepted results, we stop early.
   */
  public getFilterStopTarget(requestedCount: number): number {
    return Math.max(0, requestedCount);
  }

  public shouldStopFiltering(acceptedCount: number, requestedCount: number): boolean {
    return acceptedCount >= this.getFilterStopTarget(requestedCount);
  }
}
