import { ResultFilter, FilterContext } from '../../domain/repositories';
import { RawSearchResult } from '../../domain/entities';
import { RejectedResultReason, SearchPlatform } from '../../domain/enums';

export class PlatformUrlFilter implements ResultFilter {
  isCandidateValid(result: RawSearchResult, context?: FilterContext): { isValid: boolean; reason?: RejectedResultReason; } {
    try {
      // Must be a valid URL to parse
      const url = new URL(result.url);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      switch (result.platform) {
        case SearchPlatform.WEBSITE:
          if (this.isRejectedWebsiteHost(host)) {
            return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
          }

          // Reject common non-business paths that indicate content rather than the company itself
          if (path.match(/\/(blog|blogs|article|articles|news|post|posts|category|tag|video|videos|watch|reel|reels|story|stories|press|insights|podcast|webinar)(\/|$)/i)) {
            return { isValid: false, reason: RejectedResultReason.ARTICLE_PAGE };
          }

          if (path.match(/\.(pdf|mp4|mov|avi|wmv|jpg|jpeg|png|gif)$/i)) {
            return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
          }
          break;

        case SearchPlatform.FACEBOOK:
          if (!this.isAllowedFacebookUrl(url)) {
            return { isValid: false, reason: RejectedResultReason.POST_PAGE };
          }
          break;

        case SearchPlatform.INSTAGRAM:
          if (!this.isAllowedInstagramUrl(url)) {
            return { isValid: false, reason: RejectedResultReason.POST_PAGE };
          }
          break;

        case SearchPlatform.LINKEDIN:
          // Only allow profiles or company pages (for now, sticking strictly to /in/ or /company/)
          if (!path.startsWith('/in/') && !path.startsWith('/company/')) {
            return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
          }
          break;

        case SearchPlatform.X:
          if (!this.isAllowedXUrl(url)) {
            return { isValid: false, reason: RejectedResultReason.POST_PAGE };
          }
          break;

        case SearchPlatform.TIKTOK:
          if (!this.isAllowedTiktokUrl(url)) {
            return { isValid: false, reason: RejectedResultReason.VIDEO_PAGE };
          }
          break;

        case SearchPlatform.SNAPCHAT:
          if (!this.isAllowedSnapchatUrl(url)) {
            return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
          }
          break;
      }

      return { isValid: true };
    } catch {
      // If the URL couldn't safely parse
      return { isValid: false, reason: RejectedResultReason.INVALID_PLATFORM_URL };
    }
  }

  private isRejectedWebsiteHost(host: string): boolean {
    const rejectedWebsiteHosts = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'tiktok.com',
      'x.com',
      'twitter.com',
      'pinterest.com',
      'reddit.com',
      'medium.com',
      'yelp.com',
      'yellowpages.com',
      'tripadvisor.com',
      'foursquare.com',
      'zoominfo.com',
      'crunchbase.com',
      'glassdoor.com',
      'indeed.com',
      'wikipedia.org',
    ];

    return rejectedWebsiteHosts.some(rejectedHost =>
      host === rejectedHost || host.endsWith(`.${rejectedHost}`)
    );
  }

  private isAllowedFacebookUrl(url: URL): boolean {
    const path = url.pathname.toLowerCase();

    if (
      path === '/' ||
      path.startsWith('/groups/') ||
      path.startsWith('/events/') ||
      path.startsWith('/marketplace/') ||
      path.startsWith('/hashtag/') ||
      path.startsWith('/story.php') ||
      path.startsWith('/share/') ||
      path.startsWith('/permalink.php') ||
      path.startsWith('/watch/') ||
      path.startsWith('/reel/') ||
      path.startsWith('/reels/') ||
      path.startsWith('/videos/') ||
      path.startsWith('/video.php') ||
      path.startsWith('/photo') ||
      path.startsWith('/photos/') ||
      path.startsWith('/media/set/') ||
      path.startsWith('/posts/') ||
      path.startsWith('/notes/') ||
      path.includes('/posts/') ||
      path.includes('/videos/') ||
      path.includes('/photos/') ||
      path.includes('/reels/') ||
      path.includes('/watch') ||
      path.includes('/story') ||
      path.includes('/p/')
    ) {
      return false;
    }

    if (path.startsWith('/profile.php')) {
      return url.searchParams.has('id');
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) {
      return false;
    }

    const reservedRoots = new Set([
      'watch',
      'gaming',
      'help',
      'privacy',
      'policy',
      'business',
      'ads',
      'about',
      'login',
      'plugins',
      'stories',
      'hashtag',
      'events',
      'groups',
      'marketplace',
      'friends',
      'messages',
    ]);

    if (reservedRoots.has(segments[0])) {
      return false;
    }

    return true;
  }

  private isAllowedInstagramUrl(url: URL): boolean {
    const path = url.pathname.toLowerCase();

    if (path === '/' || path === '') {
      return false;
    }

    if (
      path.startsWith('/p/') ||
      path.startsWith('/reel/') ||
      path.startsWith('/reels/') ||
      path.startsWith('/tv/') ||
      path.startsWith('/stories/') ||
      path.startsWith('/explore/') ||
      path.startsWith('/accounts/') ||
      path.startsWith('/direct/') ||
      path.startsWith('/developer/') ||
      path.startsWith('/about/') ||
      path.startsWith('/challenge/')
    ) {
      return false;
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length !== 1) {
      return false;
    }

    const reservedRoots = new Set([
      'p',
      'reel',
      'reels',
      'tv',
      'stories',
      'explore',
      'accounts',
      'direct',
      'about',
      'developer',
      'challenge',
      'legal',
      'press',
      'api',
      'web',
    ]);

    return !reservedRoots.has(segments[0]);
  }

  private isAllowedXUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const allowedHosts = new Set([
      'x.com',
      'www.x.com',
      'mobile.x.com',
      'm.x.com',
      'twitter.com',
      'www.twitter.com',
      'mobile.twitter.com',
      'm.twitter.com',
    ]);

    if (!allowedHosts.has(host)) {
      return false;
    }

    if (
      path === '/' ||
      path.startsWith('/home') ||
      path.startsWith('/explore') ||
      path.startsWith('/search') ||
      path.startsWith('/hashtag/') ||
      path.startsWith('/i/') ||
      path.startsWith('/compose') ||
      path.startsWith('/messages') ||
      path.startsWith('/notifications') ||
      path.startsWith('/settings') ||
      path.startsWith('/share') ||
      path.includes('/status/') ||
      path.includes('/statuses/') ||
      path.includes('/photo/') ||
      path.includes('/video/')
    ) {
      return false;
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length !== 1) {
      return false;
    }

    const handle = segments[0].startsWith('@') ? segments[0].slice(1) : segments[0];
    const reservedHandles = new Set([
      'home',
      'explore',
      'search',
      'compose',
      'messages',
      'notifications',
      'settings',
      'privacy',
      'tos',
      'about',
      'login',
      'signup',
      'share',
      'intent',
      'i',
      'hashtag',
    ]);

    if (reservedHandles.has(handle)) {
      return false;
    }

    return /^[a-z0-9_]{1,15}$/i.test(handle);
  }

  private isAllowedTiktokUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const allowedHosts = new Set([
      'tiktok.com',
      'www.tiktok.com',
      'm.tiktok.com',
    ]);

    if (!allowedHosts.has(host)) {
      return false;
    }

    if (
      path === '/' ||
      path.startsWith('/discover') ||
      path.startsWith('/explore') ||
      path.startsWith('/tag/') ||
      path.startsWith('/music/') ||
      path.startsWith('/video/') ||
      path.startsWith('/embed/') ||
      path.startsWith('/share/') ||
      path.startsWith('/foryou') ||
      path.startsWith('/following') ||
      path.startsWith('/live') ||
      path.startsWith('/t/')
    ) {
      return false;
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length !== 1) {
      return false;
    }

    const profileSlug = segments[0];
    if (!profileSlug.startsWith('@')) {
      return false;
    }

    return /^@[a-z0-9._-]{2,64}$/i.test(profileSlug);
  }

  private isAllowedSnapchatUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const allowedHosts = new Set([
      'snapchat.com',
      'www.snapchat.com',
    ]);

    if (!allowedHosts.has(host)) {
      return false;
    }

    if (
      path === '/' ||
      path.startsWith('/spotlight') ||
      path.startsWith('/discover') ||
      path.startsWith('/stories') ||
      path.startsWith('/story') ||
      path.startsWith('/share') ||
      path.startsWith('/t/') ||
      path.startsWith('/p/') ||
      path.startsWith('/lens') ||
      path.startsWith('/map') ||
      path.startsWith('/news') ||
      path.startsWith('/accounts') ||
      path.startsWith('/camera') ||
      path.startsWith('/memories') ||
      path.startsWith('/subscribe')
    ) {
      return false;
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) {
      return false;
    }

    if (segments[0] === 'add') {
      return segments.length === 2 && /^[a-z0-9._-]{2,64}$/i.test(segments[1]);
    }

    if (segments.length === 1 && segments[0].startsWith('@')) {
      return /^@[a-z0-9._-]{2,64}$/i.test(segments[0]);
    }

    return false;
  }
}
