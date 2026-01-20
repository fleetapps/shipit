/**
 * Normalizes blueprint data structures that may be returned as objects
 * instead of arrays by LLMs. Converts object maps to arrays by extracting values.
 * 
 * This handles cases where models return:
 * - views: { "MainView": {...} } instead of [{ name: "...", description: "..." }]
 * - implementationRoadmap: { "Phase1": {...} } instead of [{ phase: "...", description: "..." }]
 * - initialPhase.files: { "File1": {...} } instead of [{ path: "...", purpose: "..." }]
 */
export function normalizeBlueprintData(raw: any): any {
    if (!raw || typeof raw !== 'object') {
        return raw;
    }

    const normalized = { ...raw };

    // Normalize views: object -> array, preserving key as 'name' if missing
    if (normalized.views && typeof normalized.views === 'object' && !Array.isArray(normalized.views)) {
        normalized.views = Object.entries(normalized.views).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return !('name' in value) ? { name: key, ...value } : value;
            }
            return value;
        });
    }

    // Normalize implementationRoadmap: object -> array, preserving key as 'phase' if missing
    if (normalized.implementationRoadmap && typeof normalized.implementationRoadmap === 'object' && !Array.isArray(normalized.implementationRoadmap)) {
        normalized.implementationRoadmap = Object.entries(normalized.implementationRoadmap).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return !('phase' in value) ? { phase: key, ...value } : value;
            }
            return value;
        });
    }

    // Normalize initialPhase.files: object -> array, preserving key as 'path' if missing
    if (normalized.initialPhase && typeof normalized.initialPhase === 'object') {
        normalized.initialPhase = { ...normalized.initialPhase };
        if (normalized.initialPhase.files && typeof normalized.initialPhase.files === 'object' && !Array.isArray(normalized.initialPhase.files)) {
            normalized.initialPhase.files = Object.entries(normalized.initialPhase.files).map(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return !('path' in value) ? { path: key, ...value } : value;
                }
                return value;
            });
        }
    }

    return normalized;
}
