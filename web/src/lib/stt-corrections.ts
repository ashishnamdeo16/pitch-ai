/**
 * Fix common STT mishearings in startup pitch coaching context.
 */
export function correctPitchStt(text: string): string {
  let out = text;

  const phraseFixes: Array<[RegExp, string]> = [
    [/\belevator\s+bitch\b/gi, "elevator pitch"],
    [/\bbitch\s+deck\b/gi, "pitch deck"],
    [/\bpractice\s+(?:my\s+)?bitch\b/gi, "practice pitch"],
    [/\bstartup\s+bitch\b/gi, "startup pitch"],
    [/\bmy\s+bitch\b/gi, "my pitch"],
    [/\bour\s+bitch\b/gi, "our pitch"],
    [/\bthe\s+bitch\b/gi, "the pitch"],
    [/\bthis\s+bitch\b/gi, "this pitch"],
    [/\ba\s+bitch\b/gi, "a pitch"],
    [/\bto\s+bitch\b/gi, "to pitch"],
    [/\bwill\s+bitch\b/gi, "will pitch"],
  ];

  for (const [pattern, replacement] of phraseFixes) {
    out = out.replace(pattern, replacement);
  }

  out = out
    .replace(/\bbitching\b/gi, "pitching")
    .replace(/\bbitched\b/gi, "pitched")
    .replace(/\bbitches\b/gi, "pitches")
    .replace(/\bbitch\b/gi, "pitch");

  return out;
}
