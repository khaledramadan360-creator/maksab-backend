export interface QueryDictionaryEntry {
  canonicalKey: string;
  arabicVariants: string[];
  englishVariants: string[];
}

/**
 * A rule-based static dictionary for query expansion.
 * Maps core concepts to limited English and Arabic synonyms and translation variants.
 * Concepts: real_estate, dental_clinic, marketing_manager, software_company, restaurant, cafe, gym, beauty_salon, law_firm, medical_clinic, car_dealer.
 */
export const BASE_QUERY_DICTIONARY: QueryDictionaryEntry[] = [
  {
    canonicalKey: 'real_estate',
    arabicVariants: ['عقارات', 'عقاري', 'شركة عقارية', 'مكتب عقاري'],
    englishVariants: ['Real Estate', 'Property', 'Real Estate Company', 'Real Estate Agency']
  },
  {
    canonicalKey: 'dental_clinic',
    arabicVariants: ['عيادة اسنان', 'عيادات اسنان', 'مركز اسنان', 'طبيب اسنان'],
    englishVariants: ['Dental Clinic', 'Dentist Clinic', 'Dental Center', 'Dentist']
  },
  {
    canonicalKey: 'marketing_manager',
    arabicVariants: ['مدير تسويق', 'مدير التسويق', 'رئيس قطاع التسويق'],
    englishVariants: ['Marketing Manager', 'Chief Marketing Officer', 'CMO', 'Head of Marketing']
  },
  {
    canonicalKey: 'software_company',
    arabicVariants: [
      'شركة برمجيات',
      'شركات برمجيات',
      'شركة تطوير برمجيات',
      'شركات تطوير برمجيات',
      'شركة تقنية',
      'شركات تقنية',
      'شركة حلول برمجية'
    ],
    englishVariants: [
      'Software Company',
      'Software Companies',
      'Software House',
      'Software Houses',
      'Software Development Company',
      'Software Development Companies',
      'Technology Company',
      'Technology Companies',
      'Tech Company',
      'Tech Companies'
    ]
  },
  {
    canonicalKey: 'restaurant',
    arabicVariants: ['مطعم', 'مطاعم'],
    englishVariants: ['Restaurant', 'Restaurants', 'Dining']
  },
  {
    canonicalKey: 'cafe',
    arabicVariants: ['مقهى', 'كافيه', 'مقاهي', 'كافيهات'],
    englishVariants: ['Cafe', 'Coffee Shop', 'Cafes']
  },
  {
    canonicalKey: 'gym',
    arabicVariants: ['نادي رياضي', 'جيم', 'صالة العاب رياضية', 'مركز لياقة'],
    englishVariants: ['Gym', 'Fitness Center', 'Sports Club']
  },
  {
    canonicalKey: 'beauty_salon',
    arabicVariants: ['صالون تجميل', 'مشغل نسائي', 'مركز تجميل', 'صالون حلاقة'],
    englishVariants: ['Beauty Salon', 'Salon', 'Beauty Center', 'Barbershop']
  },
  {
    canonicalKey: 'law_firm',
    arabicVariants: ['مكتب محاماة', 'شركة محاماة', 'محامون', 'مكتب قانوني'],
    englishVariants: ['Law Firm', 'Lawyers', 'Legal Counsel', 'Legal Firm']
  },
  {
    canonicalKey: 'medical_clinic',
    arabicVariants: ['عيادة طبية', 'مجمع طبي', 'مركز طبي', 'عيادات طبية'],
    englishVariants: ['Medical Clinic', 'Medical Center', 'Polyclinic', 'Healthcare Center']
  },
  {
    canonicalKey: 'car_dealer',
    arabicVariants: ['معرض سيارات', 'وكيل سيارات', 'وكالة سيارات', 'بيع سيارات'],
    englishVariants: ['Car Dealer', 'Auto Dealership', 'Car Showroom']
  }
];
