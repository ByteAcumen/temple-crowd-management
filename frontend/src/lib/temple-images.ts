// Temple Images Utility
// Curated South Indian temple images from Unsplash CDN

export const TEMPLE_IMAGES: Record<string, string> = {
    // Default fallback
    default: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop", // Meenakshi Amman Temple

    // Specific temples
    meenakshi: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop",
    tirupati: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80&auto=format&fit=crop",
    rameshwaram: "https://images.unsplash.com/photo-1589699001059-70c71f471022?w=800&q=80&auto=format&fit=crop",
    kanchipuram: "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&q=80&auto=format&fit=crop",
    madurai: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80&auto=format&fit=crop",
    thanjavur: "https://images.unsplash.com/photo-1633022376457-4a9e2e8e3c86?w=800&q=80&auto=format&fit=crop",
    chidambaram: "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800&q=80&auto=format&fit=crop",
};

/**
 * Get temple image URL based on temple name
 * Falls back to default if no match found
 */
export function getTempleImage(templeName?: string): string {
    if (!templeName) return TEMPLE_IMAGES.default;

    // Normalize temple name for matching
    const normalized = templeName.toLowerCase().trim();

    // Check for exact or partial matches
    for (const [key, url] of Object.entries(TEMPLE_IMAGES)) {
        if (key === 'default') continue;
        if (normalized.includes(key) || key.includes(normalized)) {
            return url;
        }
    }

    // Return default if no match
    return TEMPLE_IMAGES.default;
}

/**
 * Get optimized temple image URL with custom dimensions
 */
export function getTempleImageUrl(templeName?: string, width = 800, height = 600): string {
    const baseUrl = getTempleImage(templeName);
    return `${baseUrl}&w=${width}&h=${height}`;
}
