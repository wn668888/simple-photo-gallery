// 全局配置：分类目录 <-> 中文名 <-> 图片后缀
// 目录名必须是纯英文小写，中文名只用于界面展示，避免部署时路径出现中文。

import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

export const CATEGORIES = [
  { id: 'bags', label: '包包', hint: '手提包 / 双肩包 / 斜挎包' },
  { id: 'scarves', label: '围巾', hint: '丝巾 / 羊绒围巾 / 披肩' },
  { id: 'watches', label: '手表', hint: '机械表 / 石英表 / 表带' }
];

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);

export const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const PHOTOS_DIR = join(ROOT, 'photos');
export const MANIFEST_PATH = join(PHOTOS_DIR, 'manifest.json');
export const CAPTIONS_PATH = join(PHOTOS_DIR, 'captions.json');
