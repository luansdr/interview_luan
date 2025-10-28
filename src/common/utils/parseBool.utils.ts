export const parseBool = (s: string) => ['true','1','t','yes','y','sim'].includes(String(s||'').trim().toLowerCase());
