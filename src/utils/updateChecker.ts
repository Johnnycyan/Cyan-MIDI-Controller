// Cache for version info to avoid too many requests
let versionCache: { version: string; lastChecked: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

export async function checkForUpdates(currentVersion: string): Promise<[boolean, string | null, string | null]> {
    try {
        // Use cache if available and fresh
        if (versionCache && (Date.now() - versionCache.lastChecked < CACHE_DURATION)) {
            return [versionCache.version !== currentVersion, versionCache.version, null];
        }

        const response = await fetch('https://raw.githubusercontent.com/johnnycyan/cyan-midi-controller/main/package.json');
        const data = await response.json();
        
        // Update cache
        versionCache = {
            version: data.version,
            lastChecked: Date.now()
        };

        return [data.version !== currentVersion, data.version, null];
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to check for updates:', errorMessage);
        return [false, null, errorMessage];
    }
}
