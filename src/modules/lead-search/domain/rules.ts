import { RequestedResultsCount, SearchPlatform, SupportedSaudiCity } from './enums';

export const SEARCH_RULES = {
  // 1. السعودية افتراضيًا
  DEFAULT_COUNTRY: 'SA',
  DEFAULT_CITY: SupportedSaudiCity.RIYADH,

  // 2. المنصات المسموحة فقط
  ALLOWED_PLATFORMS: [
    SearchPlatform.WEBSITE,
    SearchPlatform.FACEBOOK,
    SearchPlatform.INSTAGRAM,
    SearchPlatform.SNAPCHAT,
    SearchPlatform.LINKEDIN,
    SearchPlatform.X,
    SearchPlatform.TIKTOK,
  ],

  // 3. العدد المسموح فقط
  ALLOWED_COUNTS: [
    RequestedResultsCount.TEN,
    RequestedResultsCount.TWENTY_FIVE,
    RequestedResultsCount.FIFTY,
  ],

  // 4. العدد Target حقيقي
  TARGET_COUNT_PER_PLATFORM: true,

  // 5. لا AI
  NO_AI_ENABLED: true,

  // 6. لا screenshots
  NO_SCREENSHOTS_ENABLED: true,

  // 7. لا enrichment
  NO_ENRICHMENT_ENABLED: true,

  // 8. Client-only rule
  STRICT_CLIENT_ONLY_FILTERING: true,

  // 9. Selected platforms only
  SEARCH_SELECTED_PLATFORMS_ONLY: true,

  // 10. Bilingual query expansion
  BILINGUAL_QUERY_EXPANSION_ENABLED: true,
};
