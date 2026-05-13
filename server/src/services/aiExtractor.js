/**
 * Local regex/heuristic-based event extractor.
 * Replaces the OpenAI-based extractor — no API key needed.
 *
 * Pipeline per chunk:
 *   1. Find all dates via regex
 *   2. Extract the surrounding sentence as context
 *   3. Classify the event category by keywords
 *   4. Detect party names (capitalized proper nouns)
 *   5. Build a structured event object
 */

// ──────────────────────────────────────────────
// Date Patterns
// ──────────────────────────────────────────────

const MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_ABBR = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const monthPattern = `(?:${MONTH_NAMES.join('|')}|${MONTH_ABBR.join('|')}\\.?)`;

// Matches: January 15, 2024  |  Jan 15, 2024  |  Jan. 15, 2024  |  January 2024
const WRITTEN_DATE = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})` +
    `|(${monthPattern}),?\\s+(\\d{4})`,
    'gi'
);

// Matches: 01/15/2024  |  01-15-2024  |  1/15/24
const US_DATE = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;

// Matches: 2024-01-15 (ISO)
const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

// ──────────────────────────────────────────────
// Category Keywords
// ──────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
    filing: [
        'filed', 'filing', 'file', 'petition', 'complaint', 'motion',
        'appeal', 'submit', 'submitted', 'submission', 'pleading',
        'brief', 'memorandum', 'affidavit', 'declaration',
    ],
    hearing: [
        'hearing', 'oral argument', 'arraignment', 'trial',
        'proceeding', 'court date', 'session', 'tribunal',
        'appeared before', 'presiding', 'bench',
    ],
    deposition: [
        'deposition', 'deposed', 'testimony', 'testified',
        'examination', 'cross-examination', 'interrogation',
        'witness statement', 'sworn statement',
    ],
    contract: [
        'contract', 'agreement', 'signed', 'executed',
        'lease', 'settlement', 'stipulation', 'covenant',
        'memorandum of understanding', 'mou', 'amendment',
    ],
    correspondence: [
        'letter', 'email', 'sent', 'received', 'notified',
        'notice', 'notification', 'correspondence', 'memo',
        'communicated', 'informed', 'responded',
    ],
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function monthToNumber(monthStr) {
    const lower = monthStr.replace('.', '').toLowerCase();
    let idx = MONTH_NAMES.indexOf(lower);
    if (idx === -1) idx = MONTH_ABBR.indexOf(lower);
    return idx !== -1 ? idx + 1 : null;
}

function toISO(year, month, day) {
    const y = String(year).padStart(4, '0');
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isReasonableYear(y) {
    return y >= 1900 && y <= 2100;
}

/**
 * Extract the sentence surrounding a given position in the text.
 */
function extractSentence(text, matchIndex, matchLength) {
    // Look backwards for sentence start (max 300 chars)
    let start = Math.max(0, matchIndex - 300);
    const before = text.slice(start, matchIndex);
    const sentenceStartMatch = before.match(/(?:[.!?]\s+|[\n\r]{2,})(?=[A-Z"'\(\[])/g);
    if (sentenceStartMatch) {
        const lastDelimiter = before.lastIndexOf(sentenceStartMatch[sentenceStartMatch.length - 1]);
        start = start + lastDelimiter + sentenceStartMatch[sentenceStartMatch.length - 1].length;
    }

    // Look forward for sentence end (max 300 chars)
    let end = Math.min(text.length, matchIndex + matchLength + 300);
    const after = text.slice(matchIndex + matchLength, end);
    const sentenceEndMatch = after.match(/[.!?](?:\s|$)/);
    if (sentenceEndMatch) {
        end = matchIndex + matchLength + sentenceEndMatch.index + 1;
    }

    return text.slice(start, end).trim().replace(/\s+/g, ' ');
}

/**
 * Detect a category from text based on keyword matching.
 */
function classifyCategory(sentence) {
    const lower = sentence.toLowerCase();
    let bestCategory = 'other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        for (const keyword of keywords) {
            if (lower.includes(keyword)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
}

/**
 * Extract proper noun phrases from text (potential party names).
 * Looks for sequences of capitalized words (2+ words to avoid common nouns).
 */
function extractParties(sentence) {
    // Match sequences of 2+ capitalized words, allowing for common connectors
    const partyPattern = /(?<![.!?]\s)\b([A-Z][a-z]+(?:\s+(?:of|the|and|&|de|van|von|der))*(?:\s+[A-Z][a-z]+)+)\b/g;
    const parties = new Set();
    let match;

    // Common false positives to filter out
    const SKIP_PHRASES = new Set([
        'the court', 'the state', 'the united states', 'the plaintiff',
        'the defendant', 'the judge', 'the honorable', 'supreme court',
        'district court', 'circuit court', 'superior court',
    ]);

    while ((match = partyPattern.exec(sentence)) !== null) {
        const name = match[1].trim();
        if (name.length > 3 && !SKIP_PHRASES.has(name.toLowerCase())) {
            parties.add(name);
        }
    }

    // Also look for "Corp", "Inc", "LLC" style entities
    const orgPattern = /([A-Z][\w&.]+(?:\s+[A-Z][\w&.]+)*\s+(?:Corp\.?|Inc\.?|LLC|Ltd\.?|LLP|Co\.?|Group|Foundation|Association))/g;
    while ((match = orgPattern.exec(sentence)) !== null) {
        parties.add(match[1].trim());
    }

    return [...parties].slice(0, 5); // Cap at 5 parties per event
}

/**
 * Generate a short title from the sentence.
 */
function generateTitle(sentence, category) {
    // Try to get the first meaningful clause (up to ~60 chars)
    let title = sentence
        .replace(/^[^a-zA-Z]+/, '') // strip leading non-alpha
        .split(/[,;:]/)[ 0]         // take first clause
        .trim();

    if (title.length > 80) {
        // Truncate at a word boundary
        title = title.slice(0, 80).replace(/\s+\S*$/, '') + '…';
    }

    if (title.length < 5) {
        // Fallback: use category as a title base
        const catTitles = {
            filing: 'Document Filed',
            hearing: 'Court Hearing',
            deposition: 'Deposition Taken',
            contract: 'Agreement Executed',
            correspondence: 'Correspondence Sent',
            other: 'Event Recorded',
        };
        title = catTitles[category] || 'Event Recorded';
    }

    return title;
}

// ──────────────────────────────────────────────
// Core Extraction Logic
// ──────────────────────────────────────────────

/**
 * Find all dates in a text chunk and build event objects.
 */
function extractFromChunk(chunk) {
    const events = [];
    const seenDates = new Set(); // avoid duplicate date+sentence combos

    // --- Written dates: "January 15, 2024" / "Jan 15, 2024" / "January 2024" ---
    let match;
    const writtenDateRegex = new RegExp(WRITTEN_DATE.source, 'gi');
    while ((match = writtenDateRegex.exec(chunk)) !== null) {
        let isoDate;
        if (match[1]) {
            // Full date: Month Day, Year
            const month = monthToNumber(match[1]);
            const day = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            if (!month || !isReasonableYear(year) || day < 1 || day > 31) continue;
            isoDate = toISO(year, month, day);
        } else if (match[4]) {
            // Month Year only
            const month = monthToNumber(match[4]);
            const year = parseInt(match[5], 10);
            if (!month || !isReasonableYear(year)) continue;
            isoDate = toISO(year, month, 1);
        } else {
            continue;
        }

        const sentence = extractSentence(chunk, match.index, match[0].length);
        const key = `${isoDate}|${sentence.slice(0, 50)}`;
        if (seenDates.has(key)) continue;
        seenDates.add(key);

        const category = classifyCategory(sentence);
        events.push({
            date: isoDate,
            endDate: null,
            title: generateTitle(sentence, category),
            description: sentence.slice(0, 500),
            category,
            parties: extractParties(sentence),
            confidence: 0.75,
            source: sentence.slice(0, 300),
        });
    }

    // --- ISO dates: "2024-01-15" ---
    const isoRegex = new RegExp(ISO_DATE.source, 'g');
    while ((match = isoRegex.exec(chunk)) !== null) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        if (!isReasonableYear(year) || month < 1 || month > 12 || day < 1 || day > 31) continue;

        const isoDate = toISO(year, month, day);
        const sentence = extractSentence(chunk, match.index, match[0].length);
        const key = `${isoDate}|${sentence.slice(0, 50)}`;
        if (seenDates.has(key)) continue;
        seenDates.add(key);

        const category = classifyCategory(sentence);
        events.push({
            date: isoDate,
            endDate: null,
            title: generateTitle(sentence, category),
            description: sentence.slice(0, 500),
            category,
            parties: extractParties(sentence),
            confidence: 0.8,
            source: sentence.slice(0, 300),
        });
    }

    // --- US-style dates: "01/15/2024" or "1-15-24" ---
    const usRegex = new RegExp(US_DATE.source, 'g');
    while ((match = usRegex.exec(chunk)) !== null) {
        let month = parseInt(match[1], 10);
        let day = parseInt(match[2], 10);
        let year = parseInt(match[3], 10);

        // Handle 2-digit year
        if (year < 100) {
            year += year > 50 ? 1900 : 2000;
        }

        if (!isReasonableYear(year) || month < 1 || month > 12 || day < 1 || day > 31) continue;

        const isoDate = toISO(year, month, day);
        const sentence = extractSentence(chunk, match.index, match[0].length);
        const key = `${isoDate}|${sentence.slice(0, 50)}`;
        if (seenDates.has(key)) continue;
        seenDates.add(key);

        const category = classifyCategory(sentence);
        events.push({
            date: isoDate,
            endDate: null,
            title: generateTitle(sentence, category),
            description: sentence.slice(0, 500),
            category,
            parties: extractParties(sentence),
            confidence: 0.65,
            source: sentence.slice(0, 300),
        });
    }

    return events;
}

// ──────────────────────────────────────────────
// Public API  (same signature as the old OpenAI version)
// ──────────────────────────────────────────────

/**
 * Extract events from all text chunks using local regex/heuristic extraction.
 * Drop-in replacement for the OpenAI-based version.
 */
export async function extractEventsFromChunks(chunks) {
    const allEvents = [];

    for (let i = 0; i < chunks.length; i++) {
        console.log(`  Processing chunk ${i + 1}/${chunks.length} (local extraction)...`);
        const events = extractFromChunk(chunks[i]);
        allEvents.push(...events);
    }

    console.log(`  Local extraction complete: found ${allEvents.length} raw events.`);
    return allEvents;
}
