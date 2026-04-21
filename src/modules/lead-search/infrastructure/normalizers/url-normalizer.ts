import { UrlNormalizer } from '../../domain/repositories';
import { SearchPlatform } from '../../domain/enums';

export class DefaultUrlNormalizer implements UrlNormalizer {
  
  /**
   * Cleans and canonicalizes a URL to ensure safe deduplication.
   * Removes trackers, fragments, trailing slashes, and standardizes format.
   */
  public normalize(url: string, platform: SearchPlatform): string {
    try {
      let cleanUrl = url.trim();
      
      // Attempt to fix missing protocol to make URL parsable
      if (!cleanUrl.match(/^https?:\/\//i)) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const parsed = new URL(cleanUrl);
      
      // 1. Lowercase hostname
      parsed.hostname = parsed.hostname.toLowerCase();
      
      // 2. Remove URL fragments
      parsed.hash = '';

      // 3. Remove known tracking parameters
      const trackingParams = ['fbclid', 'gclid', 'trk', 'ref'];
      const paramsToRemove: string[] = [];

      parsed.searchParams.forEach((_, key) => {
        const lowerKey = key.toLowerCase();
        if (trackingParams.includes(lowerKey) || lowerKey.startsWith('utm_')) {
          paramsToRemove.push(key);
        }
      });

      paramsToRemove.forEach(param => parsed.searchParams.delete(param));

      // 4. Platform-specific canonicalization
      // TikTok SERP often returns video links (/@handle/video/<id>).
      // Convert those URLs to the profile root to avoid dropping valid business accounts.
      if (platform === SearchPlatform.TIKTOK) {
        const segments = parsed.pathname.split('/').filter(Boolean);
        const handleSegment = segments.find(segment => segment.startsWith('@'));

        if (handleSegment) {
          parsed.pathname = `/${handleSegment}`;
          parsed.search = '';
        }
      }

      // 5. Generate canonical string
      let canonical = parsed.toString();
      
      // 6. Remove trailing slash if present (safe for canonical matching)
      if (canonical.endsWith('/')) {
        canonical = canonical.slice(0, -1);
      }

      return canonical;
    } catch (e) {
      // Fallback for malformed URLs
      let fallback = url.trim().replace(/#.*$/, '');
      if (fallback.endsWith('/')) {
        fallback = fallback.slice(0, -1);
      }
      return fallback;
    }
  }
}
