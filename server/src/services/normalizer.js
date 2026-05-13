/**
 * Normalize and deduplicate AI-extracted events.
 */
export function normalizeAndDeduplicate(events) {
    if (!events || events.length === 0) return [];

    // Step 1: Normalize each event
    const normalized = events
        .map((event) => {
            try {
                const date = parseDate(event.date);
                if (!date) return null;

                return {
                    date,
                    endDate: event.endDate ? parseDate(event.endDate) : undefined,
                    title: (event.title || 'Untitled Event').trim().slice(0, 200),
                    description: (event.description || '').trim().slice(0, 2000),
                    category: validateCategory(event.category),
                    parties: Array.isArray(event.parties) ? event.parties.map((p) => String(p).trim()) : [],
                    confidence: Math.max(0, Math.min(1, Number(event.confidence) || 0.5)),
                    source: (event.source || '').trim().slice(0, 1000),
                };
            } catch {
                return null;
            }
        })
        .filter(Boolean);

    // Step 2: Deduplicate — events with same date + very similar title
    const deduplicated = [];
    const seen = new Set();

    for (const event of normalized) {
        const dateStr = event.date.toISOString().split('T')[0];
        const titleKey = event.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
        const key = `${dateStr}|${titleKey}`;

        if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(event);
        } else {
            // Find existing event and merge — keep higher confidence
            const existing = deduplicated.find((e) => {
                const eDateStr = e.date.toISOString().split('T')[0];
                const eTitleKey = e.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
                return `${eDateStr}|${eTitleKey}` === key;
            });

            if (existing && event.confidence > existing.confidence) {
                Object.assign(existing, event);
            }
        }
    }

    return deduplicated;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

const VALID_CATEGORIES = ['filing', 'hearing', 'deposition', 'contract', 'correspondence', 'other'];

function validateCategory(category) {
    if (!category) return 'other';
    const lower = category.toLowerCase().trim();
    return VALID_CATEGORIES.includes(lower) ? lower : 'other';
}
