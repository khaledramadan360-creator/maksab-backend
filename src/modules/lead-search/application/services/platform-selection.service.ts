import { SearchRequest } from '../../domain/entities';
import { RequestedResultsCount, SearchPlatform } from '../../domain/enums';

export class PlatformSelectionService {
  private readonly priorityOrder: SearchPlatform[] = [
    SearchPlatform.WEBSITE,
    SearchPlatform.LINKEDIN,
    SearchPlatform.INSTAGRAM,
    SearchPlatform.FACEBOOK,
    SearchPlatform.X,
    SearchPlatform.TIKTOK,
    SearchPlatform.SNAPCHAT,
  ];

  public select(request: Pick<SearchRequest, 'platforms' | 'requestedResultsCount'>): SearchPlatform[] {
    const uniquePlatforms = Array.from(new Set(request.platforms || []));
    const maxPlatforms = this.resolveMaxPlatforms(request.requestedResultsCount);

    if (uniquePlatforms.length <= maxPlatforms) {
      return uniquePlatforms;
    }

    const prioritizedPlatforms = this.priorityOrder.filter(platform => uniquePlatforms.includes(platform));
    const remainingPlatforms = uniquePlatforms.filter(platform => !prioritizedPlatforms.includes(platform));

    return [...prioritizedPlatforms, ...remainingPlatforms].slice(0, maxPlatforms);
  }

  private resolveMaxPlatforms(requestedResultsCount: number): number {
    if (requestedResultsCount >= RequestedResultsCount.FIFTY) {
      return 5;
    }

    return 4;
  }
}
