let changelogCache: { message: string; lastChecked: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

export async function getLatestChangelog(): Promise<string> {
    try {
        if (changelogCache && (Date.now() - changelogCache.lastChecked < CACHE_DURATION)) {
            return changelogCache.message;
        }

        const response = await fetch('https://api.github.com/repos/johnnycyan/cyan-midi-controller/commits/main');
        const data = await response.json();
        
        const message = data.commit?.message || 'No changelog available';
        
        changelogCache = {
            message,
            lastChecked: Date.now()
        };

        return message;
    } catch (error) {
        console.error('Failed to fetch changelog:', error);
        return 'Failed to load changelog';
    }
}
