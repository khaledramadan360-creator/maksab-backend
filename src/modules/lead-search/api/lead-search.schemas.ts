import { z } from 'zod';
import { SearchPlatform, SupportedSaudiCity, RequestedResultsCount } from '../domain/enums';

export const leadSearchSchema = z.object({
  body: z.object({
    keyword: z.string().min(1, 'Keyword is required').max(200),
    saudiCity: z.nativeEnum(SupportedSaudiCity).optional(),
    platforms: z
      .array(z.nativeEnum(SearchPlatform))
      .min(1, 'At least one platform must be selected')
      .max(7),
    requestedResultsCount: z.nativeEnum(RequestedResultsCount),
    language: z.enum(['ar', 'en']).optional(),
  })
});

export type LeadSearchBody = z.infer<typeof leadSearchSchema>['body'];
