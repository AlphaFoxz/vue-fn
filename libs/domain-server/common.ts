// import { nanoid } from 'nanoid';

export function genId(prefix = ''): string {
  // return nanoid();
  const ts = Date.now().toString(36);
  const rd = Math.random().toString(36).substring(2, 10);
  return `${prefix}${ts}${rd}`;
}
