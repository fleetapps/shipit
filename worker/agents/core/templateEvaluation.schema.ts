import { z } from 'zod';

export const TemplateEvaluationSchema = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      templateId: z.string().optional(),

      domainMatch: z.number().min(0).max(5),
      capabilityMatch: z.number().min(0).max(5),
      uiFit: z.number().min(0).max(5),
      extensibility: z.number().min(0).max(5),

      conflictScore: z.number().min(0).max(5),
      confidence: z.number().min(0).max(1),

      notes: z.string().optional(),
    })
  ),
});
