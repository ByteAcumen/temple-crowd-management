// Temple Images — Generic placeholders for when actual images are missing
// All images are free for commercial use (Unsplash license)

const GENERIC_TEMPLES = [
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80', // South Indian template
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80', // Architecture
    'https://images.unsplash.com/photo-1564804955013-e02ad9516982?w=800&q=80', // Archway abstract
    'https://images.unsplash.com/photo-1600100397608-e2d47b05be59?w=800&q=80', // Ritual interior
    'https://images.unsplash.com/photo-1514222134-b57cabb8d6a4?w=800&q=80', // Golden light evening
];

/**
 * Returns a consistent generic dummy image based on the temple's name.
 * This ensures the UI remains beautiful without displaying factually incorrect
 * specific photos for temples.
 */
export function getTempleImage(templeName?: string): string {
    if (!templeName) return GENERIC_TEMPLES[0];

    // Hash the name to consistently pick the same image for the same temple
    let hash = 0;
    for (let i = 0; i < templeName.length; i++) {
        hash = templeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return GENERIC_TEMPLES[Math.abs(hash) % GENERIC_TEMPLES.length];
}

/**
 * Get optimized temple image URL with custom dimensions
 */
export function getTempleImageUrl(templeName?: string, width = 800, height = 600): string {
    const baseUrl = getTempleImage(templeName);
    return baseUrl.replace(/w=\d+/, `w=${width}`);
}
