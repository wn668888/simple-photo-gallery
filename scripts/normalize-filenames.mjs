#!/usr/bin/env node
// 批量把图片文件名规范化为「英文 + 数字 + 连字符」。
// 默认只预览，确认后加 --apply 才真正改名。
//
//   node scripts/normalize-filenames.mjs          预览
//   node scripts/normalize-filenames.mjs --apply  执行

import { readdir, rename, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { CATEGORIES, IMAGE_EXT, PHOTOS_DIR, CAPTIONS_PATH } from './config.mjs';

const APPLY = process.argv.includes('--apply');

// 中文词 -> 英文。命中即翻译，未命中的中文会被直接删除。
// 想加词就往这里补一行，键越具体越好（长词优先匹配）。
const ZH_MAP = {
  // 分类词
  双肩包: 'backpack', 背包: 'backpack', 单肩包: 'shoulder-bag', 斜挎包: 'crossbody',
  手提包: 'tote', 托特包: 'tote', 手袋: 'handbag', 水桶包: 'bucket-bag',
  贝壳包: 'shell-bag', 链条包: 'chain-bag', 机车包: 'biker-bag', 腋下包: 'hobo-bag',
  钱包: 'wallet', 卡包: 'card-holder', 零钱包: 'coin-purse', 腰包: 'waist-bag',
  胸包: 'chest-bag', 旅行包: 'travel-bag', 公文包: 'briefcase', 电脑包: 'laptop-bag',
  子母包: 'bag-set', 女包: 'handbag', 男包: 'bag', 小包: 'pouch', 包: 'bag',
  行李箱: 'luggage', 拉杆箱: 'trolley-case', 箱: 'case',
  围巾: 'scarf', 丝巾: 'silk-scarf', 方巾: 'square-scarf', 长巾: 'long-scarf',
  披肩: 'shawl', 毯子: 'blanket', 毛毯: 'blanket', 腰带: 'belt',
  手表: 'watch', 腕表: 'watch', 表带: 'watch-strap', 表盘: 'dial',
  机械表: 'mechanical-watch', 石英表: 'quartz-watch', 女表: 'ladies-watch',
  男表: 'mens-watch', 情侣表: 'couple-watch', 智能表: 'smartwatch',
  // 颜色
  玫瑰金色: 'rose-gold', 玫瑰金: 'rose-gold', 香槟金色: 'champagne-gold', 香槟金: 'champagne-gold',
  香槟色: 'champagne', 香槟: 'champagne', 米白色: 'beige', 米色: 'beige', 杏色: 'apricot',
  黑色: 'black', 白色: 'white', 红色: 'red', 粉色: 'pink', 橙色: 'orange', 黄色: 'yellow',
  绿色: 'green', 蓝色: 'blue', 紫色: 'purple', 灰色: 'gray', 棕色: 'brown', 咖啡色: 'brown',
  金色: 'gold', 银色: 'silver', 驼色: 'camel', 藏青色: 'navy',
  黑: 'black', 白: 'white', 红: 'red', 粉: 'pink', 橙: 'orange', 黄: 'yellow',
  绿: 'green', 蓝: 'blue', 紫: 'purple', 灰: 'gray', 咖: 'brown', 棕: 'brown',
  金: 'gold', 银: 'silver', 驼: 'camel',
  // 材质
  真皮: 'leather', 牛皮: 'cowhide', 羊皮: 'lambskin', 头层牛皮: 'full-grain-leather',
  漆皮: 'patent-leather', 帆布: 'canvas', 尼龙: 'nylon', 涤纶: 'polyester',
  牛津布: 'oxford-fabric', 羊毛: 'wool', 羊绒: 'cashmere', 桑蚕丝: 'mulberry-silk',
  丝绸: 'silk', 真丝: 'silk', 棉: 'cotton', 麻: 'linen', 不锈钢: 'steel',
  钛: 'titanium', 陶瓷: 'ceramic', 树脂: 'resin',
  // 款式 / 属性
  大号: 'large', 中号: 'medium', 小号: 'small', 迷你: 'mini', 加大: 'xl',
  新款: 'new', 经典: 'classic', 复古: 'vintage', 简约: 'minimal', 通勤: 'commuter',
  休闲: 'casual', 宴会: 'evening', 百搭: 'versatile',
  正面: 'front', 背面: 'back', 侧面: 'side', 内里: 'inside', 底部: 'bottom',
  细节: 'detail', 特写: 'closeup', 实拍: 'shot', 主图: 'main', 平铺: 'flat-lay',
  模特: 'model', 场景: 'scene', 白底: 'white-bg', 包装: 'package',
  单只: 'single', 一对: 'pair', 套装: 'set'
};

const ZH_KEYS = Object.keys(ZH_MAP).sort((a, b) => b.length - a.length);
const CJK_RE = /[\u2e80-\u2eff\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/g;

function slugify(rawName, categoryId) {
  let out = rawName;
  for (const zh of ZH_KEYS) {
    if (out.includes(zh)) out = out.split(zh).join(`-${ZH_MAP[zh]}-`);
  }
  out = out.replace(CJK_RE, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (!out) return '';
  if (!out.startsWith(`${categoryId}-`)) out = `${categoryId}-${out}`;
  return out;
}

function uniqueName(desired, taken) {
  if (!taken.has(desired)) return desired;
  const ext = extname(desired);
  const stem = basename(desired, ext);
  let i = 2;
  while (taken.has(`${stem}-${i}${ext}`)) i += 1;
  return `${stem}-${i}${ext}`;
}

async function main() {
  const plan = [];
  const unsupported = [];

  for (const cat of CATEGORIES) {
    const dir = join(PHOTOS_DIR, cat.id);
    if (!existsSync(dir)) continue;

    const entries = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isFile());
    const taken = new Set(entries.map((e) => e.name.toLowerCase()));
    let seq = 0;

    for (const entry of entries) {
      const name = entry.name;
      if (name.startsWith('.') || name === 'manifest.json' || name === 'captions.json') continue;

      const rawExt = extname(name);
      const ext = rawExt.toLowerCase();
      if (!IMAGE_EXT.has(ext)) {
        unsupported.push(`photos/${cat.id}/${name}`);
        continue;
      }

      const stem = basename(name, rawExt);
      let slug = slugify(stem, cat.id);
      if (!slug) {
        do {
          seq += 1;
          slug = `${cat.id}-${String(seq).padStart(3, '0')}`;
        } while (taken.has(`${slug}${ext}`));
      }

      const desired = `${slug}${ext}`;
      if (desired === name) continue;

      const target = uniqueName(desired, taken);
      taken.delete(name.toLowerCase());
      taken.add(target);
      plan.push({ dir, from: name, to: target });
    }
  }

  if (unsupported.length) {
    console.log('\n[注意] 以下文件不是受支持的图片格式，已跳过：');
    for (const f of unsupported) console.log(`       - ${f}`);
    console.log('       HEIC/HEIF 浏览器无法直接显示，请先转成 JPG 或 WebP。');
  }

  if (!plan.length) {
    console.log('\n[ok] 所有文件名已经合规，无需改动。');
    return;
  }

  console.log(`\n待改名 ${plan.length} 个文件：\n`);
  const width = Math.min(56, Math.max(...plan.map((p) => p.from.length)));
  for (const p of plan) {
    console.log(`  ${p.from.padEnd(width)}  ->  ${p.to}`);
  }

  if (!APPLY) {
    console.log('\n以上只是预览，没有改动任何文件。确认无误后执行：');
    console.log('  npm run normalize:apply\n');
    return;
  }

  // 两阶段改名，避免 A->B 时 B 已存在导致的覆盖
  const temped = [];
  for (let i = 0; i < plan.length; i += 1) {
    const p = plan[i];
    const tmp = join(p.dir, `.__tmp_${i}${extname(p.from)}`);
    await rename(join(p.dir, p.from), tmp);
    temped.push({ ...p, tmp });
  }
  for (const p of temped) {
    await rename(p.tmp, join(p.dir, p.to));
  }

  console.log(`\n[ok] 已重命名 ${plan.length} 个文件。`);

  // 同步 captions.json 里的键，别让中文标题失效
  if (existsSync(CAPTIONS_PATH)) {
    try {
      const captions = JSON.parse(await readFile(CAPTIONS_PATH, 'utf8'));
      let changed = 0;
      for (const p of plan) {
        if (typeof captions[p.from] === 'string') {
          captions[p.to] = captions[p.from];
          delete captions[p.from];
          changed += 1;
        }
      }
      if (changed) {
        await writeFile(CAPTIONS_PATH, `${JSON.stringify(captions, null, 2)}\n`, 'utf8');
        console.log(`[ok] 已同步 photos/captions.json 中 ${changed} 条中文标题。`);
      }
    } catch (err) {
      console.warn(`[warn] captions.json 未更新：${err.message}`);
    }
  }

  console.log('接着重建图库索引：npm run build\n');
}

main().catch((err) => {
  console.error('[fail] 改名失败：', err);
  process.exit(1);
});
