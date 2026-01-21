/**
 * Normalizes blueprint data structures that may be returned as objects
 * instead of arrays by LLMs. Converts object maps to arrays by extracting values.
 * 
 * This handles cases where models return:
 * - views: { "MainView": {...} } instead of [{ name: "...", description: "..." }]
 * - implementationRoadmap: { "Phase1": {...} } instead of [{ phase: "...", description: "..." }]
 * - initialPhase.files: { "File1": {...} } instead of [{ path: "...", purpose: "..." }]
 * - pitfalls: { "Pitfall1": "..." } instead of ["...", "..."]
 * - frameworks: { "Framework1": "..." } instead of ["...", "..."]
 * - colorPalette: { "Color1": "..." } instead of ["...", "..."]
 */
export function normalizeBlueprintData(raw: any): any {
    if (!raw || typeof raw !== 'object') {
        return raw;
    }

    // Handle arrays - recursively normalize items
    if (Array.isArray(raw)) {
        return raw.map(item => normalizeBlueprintData(item));
    }

    const normalized = { ...raw };

    // Normalize views: object -> array, preserving key as 'name' if missing
    if (normalized.views && typeof normalized.views === 'object' && !Array.isArray(normalized.views)) {
        normalized.views = Object.entries(normalized.views).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return !('name' in value) ? { name: key, ...normalizeBlueprintData(value) } : normalizeBlueprintData(value);
            }
            return normalizeBlueprintData(value);
        });
    } else if (Array.isArray(normalized.views)) {
        // Recursively normalize array items
        normalized.views = normalized.views.map(item => normalizeBlueprintData(item));
    }

    // Normalize implementationRoadmap: object -> array, preserving key as 'phase' if missing
    if (normalized.implementationRoadmap && typeof normalized.implementationRoadmap === 'object' && !Array.isArray(normalized.implementationRoadmap)) {
        normalized.implementationRoadmap = Object.entries(normalized.implementationRoadmap).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return !('phase' in value) ? { phase: key, ...normalizeBlueprintData(value) } : normalizeBlueprintData(value);
            }
            return normalizeBlueprintData(value);
        });
    } else if (Array.isArray(normalized.implementationRoadmap)) {
        // Recursively normalize array items
        normalized.implementationRoadmap = normalized.implementationRoadmap.map(item => normalizeBlueprintData(item));
    }

    // Normalize initialPhase: recursively normalize nested structure
    if (normalized.initialPhase && typeof normalized.initialPhase === 'object' && !Array.isArray(normalized.initialPhase)) {
        normalized.initialPhase = normalizeBlueprintData(normalized.initialPhase);
        // Ensure files is normalized
        if (normalized.initialPhase.files && typeof normalized.initialPhase.files === 'object' && !Array.isArray(normalized.initialPhase.files)) {
            normalized.initialPhase.files = Object.entries(normalized.initialPhase.files).map(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return !('path' in value) ? { path: key, ...normalizeBlueprintData(value) } : normalizeBlueprintData(value);
                }
                return normalizeBlueprintData(value);
            });
        }
    }

    // Normalize pitfalls: object -> array (simple string array)
    if (normalized.pitfalls && typeof normalized.pitfalls === 'object' && !Array.isArray(normalized.pitfalls)) {
        normalized.pitfalls = Object.values(normalized.pitfalls).filter((v): v is string => typeof v === 'string');
    } else if (Array.isArray(normalized.pitfalls)) {
        // Ensure all items are strings
        normalized.pitfalls = normalized.pitfalls.filter((v): v is string => typeof v === 'string');
    }

    // Normalize frameworks: object -> array (simple string array)
    if (normalized.frameworks && typeof normalized.frameworks === 'object' && !Array.isArray(normalized.frameworks)) {
        normalized.frameworks = Object.values(normalized.frameworks).filter((v): v is string => typeof v === 'string');
    } else if (Array.isArray(normalized.frameworks)) {
        // Ensure all items are strings
        normalized.frameworks = normalized.frameworks.filter((v): v is string => typeof v === 'string');
    }

    // Normalize colorPalette: object -> array (simple string array)
    if (normalized.colorPalette && typeof normalized.colorPalette === 'object' && !Array.isArray(normalized.colorPalette)) {
        normalized.colorPalette = Object.values(normalized.colorPalette).filter((v): v is string => typeof v === 'string');
    } else if (Array.isArray(normalized.colorPalette)) {
        // Ensure all items are strings
        normalized.colorPalette = normalized.colorPalette.filter((v): v is string => typeof v === 'string');
    }

    return normalized;
}
