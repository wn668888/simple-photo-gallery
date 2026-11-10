#!/usr/bin/env node
// 扫描 photos/<分类>/ 下的图片，生成 photos/manifest.json 供前端读取。
// Vercel 每次部署时自动执行（见 vercel.json 的 buildCommand）。

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { CATEGORIES, IMAGE_EXT, PHOTOS_DIR, MANIFEST_PATH, CAPTIONS_PATH } from './config.mjs';

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*$/;

function prettify(file) {
  let name = basename(file, extname(file));
  for (const c of CATEGORIES) {
    if (name.startsWith(`${c.id}-`)) name = name.slice(c.id.length + 1);
  }
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

function naturalSort(a, b) {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

async function loadCaptions() {
  if (!existsSync(CAPTIONS_PATH)) return {};
  try {
    return JSON.parse(await readFile(CAPTIONS_PATH, 'utf8'));
  } catch (err) {
    console.warn(`[warn] photos/captions.json 不是合法 JSON，已忽略：${err.message}`);
    return {};
  }
}

async function main() {
  const captions = await loadCaptions();
  const risky = [];
  const categories = [];
  let total = 0;

  for (const cat of CATEGORIES) {
    const dir = join(PHOTOS_DIR, cat.id);
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      console.warn(`[warn] 缺少目录 photos/${cat.id}/，按空分类处理`);
    }

    const files = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        console.warn(`[warn] photos/${cat.id}/${entry.name}/ 是子目录，已被跳过（请把图片直接放在分类目录下）`);
        continue;
      }
      const name = entry.name;
      if (name.startsWith('.') || name === 'manifest.json' || name === 'captions.json') continue;
      if (!IMAGE_EXT.has(extname(name).toLowerCase())) continue;

      if (!SAFE_NAME.test(name)) {
        risky.push(`photos/${cat.id}/${name}`);
      }
      files.push(name);
    }

    files.sort(naturalSort);

    const photos = files.map((file) => ({
      src: `photos/${cat.id}/${encodeURI(file)}`,
      file,
      title: captions[file] || captions[basename(file, extname(file))] || prettify(file)
    }));

    total += photos.length;
    categories.push({ id: cat.id, label: cat.label, count: photos.length, photos });
    console.log(`[ok] ${cat.label.padEnd(4, ' ')} photos/${cat.id.padEnd(8, ' ')} ${String(photos.length).padStart(3, ' ')} 张`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    total,
    categories
  };

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`[ok] 已生成 photos/manifest.json，共 ${total} 张图片`);

  if (risky.length) {
    console.warn('\n[warn] 以下文件名含中文 / 空格 / 特殊符号，可能导致线上 404：');
    for (const f of risky.slice(0, 20)) console.warn(`       - ${f}`);
    if (risky.length > 20) console.warn(`       …… 另有 ${risky.length - 20} 个`);
    console.warn('       本地运行 npm run normalize 预览改名，npm run normalize:apply 执行。\n');
  }

  if (total === 0) {
    console.warn('[warn] 图库是空的。把图片放进 photos/bags、photos/scarves、photos/watches 后重新构建。');
  }
}

main().catch((err) => {
  console.error('[fail] 生成 manifest 失败：', err);
  process.exit(1);
});
