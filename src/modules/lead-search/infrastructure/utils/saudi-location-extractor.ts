import { SupportedSaudiCity } from '../../domain/enums';

type CityLocationRule = {
  city: SupportedSaudiCity;
  patterns: string[];
};

const COUNTRY_PATTERNS = [
  'saudi arabia',
  'kingdom of saudi arabia',
  'ksa',
  'السعودية',
  'السعوديه',
  'المملكة العربية السعودية',
];

const CITY_LOCATION_RULES: CityLocationRule[] = [
  { city: SupportedSaudiCity.RIYADH, patterns: ['riyadh', 'al riyadh', 'الرياض'] },
  { city: SupportedSaudiCity.JEDDAH, patterns: ['jeddah', 'جدة', 'جده'] },
  { city: SupportedSaudiCity.MAKKAH, patterns: ['makkah', 'mecca', 'مكة', 'مكه'] },
  {
    city: SupportedSaudiCity.MADINAH,
    patterns: ['madinah', 'medina', 'المدينة', 'المدينه', 'المدينة المنورة', 'المدينه المنوره'],
  },
  { city: SupportedSaudiCity.DAMMAM, patterns: ['dammam', 'الدمام'] },
  { city: SupportedSaudiCity.KHOBAR, patterns: ['khobar', 'al khobar', 'الخبر'] },
  { city: SupportedSaudiCity.DHAHRAN, patterns: ['dhahran', 'الظهران'] },
  { city: SupportedSaudiCity.TAIF, patterns: ['taif', 'الطائف', 'الطايف'] },
  { city: SupportedSaudiCity.TABUK, patterns: ['tabuk', 'تبوك'] },
  { city: SupportedSaudiCity.ABHA, patterns: ['abha', 'أبها', 'ابها'] },
  {
    city: SupportedSaudiCity.KHAMIS_MUSHAIT,
    patterns: ['khamis mushait', 'khamis mushayt', 'خميس مشيط'],
  },
  {
    city: SupportedSaudiCity.BURAIDAH,
    patterns: ['buraidah', 'bureidah', 'buraydah', 'بريدة', 'بريده'],
  },
  { city: SupportedSaudiCity.HAIL, patterns: ['hail', 'حائل', 'حايل'] },
  { city: SupportedSaudiCity.JAZAN, patterns: ['jazan', 'jizan', 'جازان', 'جيزان'] },
  { city: SupportedSaudiCity.NAJRAN, patterns: ['najran', 'نجران'] },
  {
    city: SupportedSaudiCity.AL_AHSA,
    patterns: ['al ahsa', 'al-ahsa', 'alahsa', 'ahsa', 'الأحساء', 'الاحساء'],
  },
  { city: SupportedSaudiCity.YANBU, patterns: ['yanbu', 'ينبع'] },
  { city: SupportedSaudiCity.JUBAIL, patterns: ['jubail', 'al jubail', 'الجبيل'] },
];

const normalizeLocationText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[|,/\\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractSaudiLocation = (text: string): string => {
  const normalizedText = normalizeLocationText(text);

  for (const rule of CITY_LOCATION_RULES) {
    for (const pattern of rule.patterns) {
      if (normalizedText.includes(normalizeLocationText(pattern))) {
        return `${rule.city}, Saudi Arabia`;
      }
    }
  }

  for (const pattern of COUNTRY_PATTERNS) {
    if (normalizedText.includes(normalizeLocationText(pattern))) {
      return 'Saudi Arabia';
    }
  }

  return '';
};
