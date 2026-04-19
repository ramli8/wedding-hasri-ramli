export function useDemoRoute() {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    const getRoute = (path: string) => {
        if (!isDemoMode) return path;
        
        // If it already starts with /demo, return as is
        if (path.startsWith('/demo')) return path;
        
        // Handle root
        if (path === '/') return '/demo';
        
        return `/demo${path}`;
    };

    return { getRoute, isDemoMode };
}
