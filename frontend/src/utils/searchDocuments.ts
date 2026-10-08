import type { Doc, Source } from '@/types/campus';
const stop = new Set([
  'como',
  'para',
  'uma',
  'um',
  'que',
  'qual',
  'quais',
  'onde',
  'meu',
  'minha',
  'com',
  'por',
  'dos',
  'das',
  'esse',
  'essa',
  'faco',
  'posso',
  'pelo',
  'pela',
  'tenho',
  'preciso',
  'sobre',
]);
function words(s: string) {
  return (
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length > 2 && !stop.has(w)) || []
  );
}
export function searchDocs(question: string, docs: Doc[]): Source[] {
  const expanded = question
    .replace(/diploma/gi, 'diploma documento segunda via')
    .replace(/perdi/gi, 'perdi segunda via')
    .replace(/certificado/gi, 'certificado horas complementares');
  const q = words(expanded);
  return docs
    .flatMap((d) =>
      d.chunks.map((c) => {
        const w = words(d.title + ' ' + c.text);
        return {
          document_id: d.id,
          title: d.title,
          page: c.page,
          text: c.text,
          score:
            q.filter((x) => w.some((y) => y.startsWith(x) || x.startsWith(y))).length /
            Math.max(q.length, 1),
        };
      }),
    )
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
