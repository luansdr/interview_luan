export const parseFrequencyHours = (raw: string): number | null => {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(\d+)\/(\d+)(h|hora|horas)?$/);
  if (m) return parseInt(m[2], 10);
  return null;
};
