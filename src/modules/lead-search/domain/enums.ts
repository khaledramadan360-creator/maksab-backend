export enum SearchPlatform {
  WEBSITE = 'website',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  SNAPCHAT = 'snapchat',
  LINKEDIN = 'linkedin',
  X = 'x',
  TIKTOK = 'tiktok',
}

export enum SupportedSaudiCity {
  RIYADH = 'Riyadh',
  JEDDAH = 'Jeddah',
  MAKKAH = 'Makkah',
  MADINAH = 'Madinah',
  DAMMAM = 'Dammam',
  KHOBAR = 'Khobar',
  DHAHRAN = 'Dhahran',
  TAIF = 'Taif',
  TABUK = 'Tabuk',
  ABHA = 'Abha',
  KHAMIS_MUSHAIT = 'Khamis Mushait',
  BURAIDAH = 'Buraidah',
  HAIL = 'Hail',
  JAZAN = 'Jazan',
  NAJRAN = 'Najran',
  AL_AHSA = 'Al Ahsa',
  YANBU = 'Yanbu',
  JUBAIL = 'Jubail',
}

export enum RequestedResultsCount {
  TEN = 10,
  TWENTY_FIVE = 25,
  FIFTY = 50,
}

export enum ResultType {
  BUSINESS_PROFILE = 'business_profile',
  PROFESSIONAL_PROFILE = 'professional_profile',
  OFFICIAL_BUSINESS_PAGE = 'official_business_page',
  OFFICIAL_WEBSITE = 'official_website',
  UNKNOWN = 'unknown',
}

export enum RejectedResultReason {
  DUPLICATE = 'duplicate',
  INVALID_PLATFORM_URL = 'invalid_platform_url',
  UNSUPPORTED_PAGE_TYPE = 'unsupported_page_type',
  CONTENT_PAGE = 'content_page',
  ARTICLE_PAGE = 'article_page',
  VIDEO_PAGE = 'video_page',
  POST_PAGE = 'post_page',
  NEWS_PAGE = 'news_page',
  MISSING_BASIC_FIELDS = 'missing_basic_fields',
  LOW_RELEVANCE = 'low_relevance',
  NOT_A_POTENTIAL_CLIENT = 'not_a_potential_client',
}
