/**
 * Split text into overlapping chunks that respect paragraph boundaries.
 * This ensures no context is lost at chunk boundaries.
 */
export function chunkText(text, maxChars = 6000, overlapChars = 500) {
    if (!text || text.length <= maxChars) {
        return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = start + maxChars;

        if (end >= text.length) {
            chunks.push(text.slice(start).trim());
            break;
        }

        // Try to break at a paragraph boundary
        const searchRegion = text.slice(end - 200, end + 200);
        const paragraphBreak = searchRegion.lastIndexOf('\n\n');

        if (paragraphBreak !== -1) {
            end = end - 200 + paragraphBreak;
        } else {
            // Fall back to sentence boundary
            const sentenceBreak = searchRegion.lastIndexOf('. ');
            if (sentenceBreak !== -1) {
                end = end - 200 + sentenceBreak + 1;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlapChars; // Overlap to preserve context
    }

    return chunks.filter((c) => c.length > 0);
}
