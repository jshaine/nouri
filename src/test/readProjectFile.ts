import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Reads a file relative to the repo root (Vitest runs from there). */
export function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}
