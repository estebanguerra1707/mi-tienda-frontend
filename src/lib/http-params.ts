// src/lib/http-params.ts
export function cleanParams<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};

  for (const k of Object.keys(obj) as Array<keyof T>) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }

  return out;
}
