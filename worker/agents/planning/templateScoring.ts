import { TemplateAnalysis, TemplateCandidate } from './templateTypes';

export function scoreTemplate(
  template: TemplateCandidate,
  analysis: TemplateAnalysis,
): number {

  const qualityMultiplier =
    template.manifest?.quality_tier === 'production' ? 1.3 :
    template.manifest?.quality_tier === 'starter' ? 1.0 : 0.8;

  const coreFit =
    analysis.domainMatch * 3 +
    analysis.capabilityMatch * 4 +
    analysis.uiFit * 2 +
    analysis.extensibility;

  const conflictPenalty = analysis.conflictScore * 4;

  return (coreFit * qualityMultiplier) - conflictPenalty;
}
