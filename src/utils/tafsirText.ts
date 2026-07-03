export type TafsirSegment = {
  text: string;
  highlight?: 'green' | 'blue';
};

const SPAN_RE = /<span class="(green|blue)">(.*?)<\/span>/g;

export function parseTafsirHtml(html: string): TafsirSegment[] {
  const segments: TafsirSegment[] = [];
  let lastIndex = 0;

  for (const match of html.matchAll(SPAN_RE)) {
    const [full, cls, inner] = match;
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ text: html.slice(lastIndex, start) });
    }
    segments.push({
      text: inner,
      highlight: cls as 'green' | 'blue',
    });
    lastIndex = start + full.length;
  }

  if (lastIndex < html.length) {
    segments.push({ text: html.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text: html }];
}

export function stripTafsirHtml(html: string): string {
  return html.replace(/<span class="(?:green|blue)">(.*?)<\/span>/g, '$1');
}
