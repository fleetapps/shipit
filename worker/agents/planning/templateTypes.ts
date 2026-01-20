import { ProjectType } from "../core/types";
import { z } from 'zod';

export type ProjectCategory = 'app' | 'workflow' | 'presentation' | 'general';

export interface TemplateManifest {
  id: string;
  name: string;
  category: ProjectCategory;

  domains: string[];
  capabilities: string[];

  ui_density?: 'low' | 'medium' | 'high';
  quality_tier?: 'demo' | 'starter' | 'production';

  frontend_stack?: string[];
  backend_stack?: string[];
  integrations?: string[];

  clone_of?: string[];
}

export interface TemplateInfo {
  id: string;
  name: string;
  manifest: TemplateManifest;
}

export interface TemplateAnalysis {
  templateId: string;
  name: string;
  domainMatch: number;        // 0–5
  capabilityMatch: number;    // 0–5
  uiFit: number;              // 0–5
  extensibility: number;      // 0–5

  conflictScore: number;      // 0–5
  confidence: number;         // 0–1

  notes?: string;
}

export interface TemplateSelectionResult {
  primary: TemplateInfo;
  secondary?: TemplateInfo;
  confidence: number;
  reasoning: string;
  rejected?: {
    template: TemplateInfo;
    reason: string;
  };
}

export interface TemplateCandidate {
    name: string;
    projectType: ProjectType;
    description: {
      selection: string;
      usage: string;
    };
    disabled: boolean;
    language?: string;
    frameworks?: string[];
    renderMode?: 'sandbox' | 'browser';
    slideDirectory?: string;
  
    // Optional enrichment
    manifest?: {
      id?: string;
      quality_tier?: 'production' | 'starter' | 'experimental';
      clone_of?: string[];
      domain?: string;
    };
  }
  
  export const TemplateCandidateSchema = z.object({
    name: z.string(),
    projectType: z.enum(['app', 'workflow', 'presentation', 'general']),
    description: z.object({
      selection: z.string(),
      usage: z.string(),
    }),
    disabled: z.boolean(),
  })