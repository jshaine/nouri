/**
 * Renders the app icon SVG to the PNG sizes the manifest and iOS need.
 * Run with `npm run icons` after changing public/icons/icon.svg.
 * Uses Playwright's Chromium (already a dev dependency) as the rasterizer.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ICON_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));

interface Target {
  file: string;
  size: number;
  /** Maskable icons get the full-bleed variant (content inside the 80% safe zone). */
  source: 'icon.svg' | 'icon-maskable.svg';
}

const TARGETS: readonly Target[] = [
  { file: 'icon-192.png', size: 192, source: 'icon.svg' },
  { file: 'icon-512.png', size: 512, source: 'icon.svg' },
  { file: 'maskable-192.png', size: 192, source: 'icon-maskable.svg' },
  { file: 'maskable-512.png', size: 512, source: 'icon-maskable.svg' },
  { file: 'apple-touch-icon.png', size: 180, source: 'icon-maskable.svg' },
];

const browser = await chromium.launch();
try {
  for (const { file, size, source } of TARGETS) {
    const svg = await readFile(ICON_DIR + source, 'utf8');
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await page.screenshot({ path: ICON_DIR + file, omitBackground: true });
    await page.close();
    console.log(`wrote public/icons/${file}`);
  }
} finally {
  await browser.close();
}
