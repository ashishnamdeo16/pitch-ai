/**
 * Merge a new STT segment into accumulated transcript.
 * Handles Web Speech cumulative finals ("hello" then "hello world") and duplicates.
 */
export function mergeTranscriptSegment(
  existing: string,
  segment: string
): { text: string; appended: boolean } {
  const base = existing.trim();
  const seg = segment.trim();

  if (!seg) return { text: base, appended: false };
  if (!base) return { text: seg, appended: true };

  if (base === seg || base.endsWith(seg)) {
    return { text: base, appended: false };
  }

  // Cumulative final — segment restates prior text plus new words
  if (seg.startsWith(base)) {
    const delta = seg.slice(base.length).trim();
    if (!delta) return { text: base, appended: false };
    return { text: `${base} ${delta}`, appended: true };
  }

  // Overlap at boundary (e.g. base "…hello", seg "hello world")
  const overlap = suffixPrefixWordOverlap(base, seg);
  if (overlap > 0) {
    const delta = seg.slice(overlap).trim();
    if (!delta) return { text: base, appended: false };
    return { text: `${base} ${delta}`, appended: true };
  }

  return { text: `${base} ${seg}`, appended: true };
}

function suffixPrefixWordOverlap(base: string, segment: string): number {
  const max = Math.min(base.length, segment.length);
  for (let len = max; len > 0; len--) {
    if (base.endsWith(segment.slice(0, len))) return len;
  }
  return 0;
}
