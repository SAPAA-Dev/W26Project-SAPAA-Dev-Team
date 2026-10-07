// Renders docs/assets/*.mmd to docs/images/*.svg with mermaid-cli.
// A diagram is rendered again only when its source, the config or the tool versions change.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// The SVGs in docs/images use the mermaid-cli 12 defaults: "neo" look, white background,
// font "Recursive Variable", arial, sans-serif (embedded). Only two options are added, so a
// re-render is byte-stable: fixed element ids, and a fixed seed for the neo look's shape paths.
// A diagram's own frontmatter (for example `layout: elk`) still applies.
export const MERMAID_CONFIG = {
  deterministicIds: true,
  handDrawnSeed: 1,
};

const VERSIONS = ['@mermaid-js/mermaid-cli', 'mermaid']
  .map((p) => `${p}@${JSON.parse(fs.readFileSync(new URL(`../node_modules/${p}/package.json`, import.meta.url))).version}`)
  .join(' ');

export function hashOf(source) {
  return crypto.createHash('sha256')
    .update(VERSIONS).update(JSON.stringify(MERMAID_CONFIG)).update(source)
    .digest('hex').slice(0, 16);
}

// docs/software-design.md links "[Mermaid source](assets/X.mmd)" and then the image.
// The image name is used when it differs from X.svg (for example ER_Diagram_mermaid.svg).
export function svgNames(designDoc) {
  const map = new Map();
  const re = /\]\(assets\/([^)]+\.mmd)\)(?:(?!\]\(assets\/)[\s\S])*?\]\(images\/([^)]+\.svg)\)/g;
  for (const [, mmd, svg] of designDoc.matchAll(re)) if (!map.has(mmd)) map.set(mmd, svg);
  return map;
}

export function plan({ assetsDir, imagesDir, designDoc, hashes, force = false }) {
  const names = svgNames(designDoc);
  return fs.readdirSync(assetsDir).filter((f) => f.endsWith('.mmd')).sort().map((mmd) => {
    const source = fs.readFileSync(path.join(assetsDir, mmd), 'utf8');
    const svg = names.get(mmd) ?? mmd.replace(/\.mmd$/, '.svg');
    const hash = hashOf(source);
    const stale = force || hashes[mmd] !== hash || !fs.existsSync(path.join(imagesDir, svg));
    return { mmd, svg, source, hash, stale };
  });
}

export async function render(jobs, imagesDir, log = console.log) {
  if (!jobs.length) return [];
  const { renderMermaid } = await import('@mermaid-js/mermaid-cli');
  const puppeteer = (await import('puppeteer')).default;
  // GitHub's Ubuntu runners block the Chrome sandbox, so CI turns it off.
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  });
  const failed = [];
  try {
    for (const job of jobs) {
      try {
        const { data } = await renderMermaid(browser, job.source, 'svg', {
          backgroundColor: 'white',
          mermaidConfig: MERMAID_CONFIG,
        });
        fs.writeFileSync(path.join(imagesDir, job.svg), data);
        log(`rendered ${job.mmd} -> ${path.join(path.basename(imagesDir), job.svg)}`);
      } catch (err) {
        failed.push(job.mmd);
        log(`FAILED ${job.mmd}: ${err.message.split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
  return failed;
}
