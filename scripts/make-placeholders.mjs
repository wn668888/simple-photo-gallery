#!/usr/bin/env node
// 生成占位图，让首次部署不是空白页。删除 photos/<分类>/*-sample-*.svg 即可移除。

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, PHOTOS_DIR, CAPTIONS_PATH } from './config.mjs';

const THEME = {
  bags: { from: '#EFE9E0', to: '#CFC4B3', ink: '#6B5F4E', sub: '#8C7F6C' },
  scarves: { from: '#EAE9E1', to: '#BFC7B7', ink: '#5E6653', sub: '#828A76' },
  watches: { from: '#E6E9EC', to: '#B7BEC6', ink: '#545C66', sub: '#7B848E' }
};

const PER_CATEGORY = 3;

function svg(cat, index) {
  const t = THEME[cat.id] || THEME.bags;
  const no = String(index).padStart(2, '0');
  const file = `${cat.id}-sample-${no}.svg`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.from}"/>
      <stop offset="1" stop-color="${t.to}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#g)"/>
  <rect x="60" y="60" width="780" height="1080" fill="none" stroke="${t.ink}" stroke-opacity="0.25" stroke-width="2"/>
  <line x1="60" y1="600" x2="840" y2="600" stroke="${t.ink}" stroke-opacity="0.12" stroke-width="1"/>
  <line x1="450" y1="60" x2="450" y2="1140" stroke="${t.ink}" stroke-opacity="0.12" stroke-width="1"/>
  <text x="450" y="560" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="64" fill="${t.ink}">${cat.label}示例图</text>
  <text x="450" y="630" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="28" fill="${t.sub}">${file}</text>
  <text x="450" y="690" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="24" fill="${t.sub}" opacity="0.85">上传真实商品图后删除此文件</text>
  <text x="450" y="1120" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="22" fill="${t.sub}" opacity="0.7">SIMPLE GALLERY</text>
</svg>
`;
}

async function main() {
  let captions = {};
  if (existsSync(CAPTIONS_PATH)) {
    try {
      captions = JSON.parse(await readFile(CAPTIONS_PATH, 'utf8'));
    } catch {
      captions = {};
    }
  }

  let created = 0;
  for (const cat of CATEGORIES) {
    const dir = join(PHOTOS_DIR, cat.id);
    await mkdir(dir, { recursive: true });
    for (let i = 1; i <= PER_CATEGORY; i += 1) {
      const no = String(i).padStart(2, '0');
      const file = `${cat.id}-sample-${no}.svg`;
      const target = join(dir, file);
      if (existsSync(target)) continue;
      await writeFile(target, svg(cat, i), 'utf8');
      captions[file] = `${cat.label} · 示例 ${no}`;
      created += 1;
    }
  }

  await writeFile(CAPTIONS_PATH, `${JSON.stringify(captions, null, 2)}\n`, 'utf8');
  console.log(`[ok] 已创建 ${created} 张占位图，说明已写入 photos/captions.json`);
}

main().catch((err) => {
  console.error('[fail] 生成占位图失败：', err);
  process.exit(1);
});
