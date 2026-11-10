# simple-photo-gallery

箱包 / 围巾 / 手表 商品图的**纯静态图库**。零依赖、无框架、无后端，只做一件事：把图片按分类漂亮地展示出来。

- 上传图片 → 推到 GitHub → Vercel 自动部署，全程不用改代码
- 分类：包包 `bags`、围巾 `scarves`、手表 `watches`
- 瀑布流布局 + 灯箱大图（键盘 `←` `→` `Esc`）
- 内置**文件名规范化脚本**：中文 / 空格 / 特殊符号一键转成英文，避免部署后 404
- 无购物车、无登录、无支付，就是一个干净的看图页

> 详细的逐步操作（含每一步的坑）见 **[GUIDE.md](./GUIDE.md)**。

## 目录结构

```
simple-photo-gallery/
├── index.html                    图库页面
├── assets/
│   ├── style.css                 样式（配色集中在 :root）
│   └── app.js                    读取索引、渲染、灯箱
├── photos/
│   ├── bags/                     包包
│   ├── scarves/                  围巾
│   ├── watches/                  手表
│   ├── captions.json             可选：文件名 → 中文标题（不改名也能用）
│   └── manifest.json             自动生成的索引，勿手改
├── scripts/
│   ├── config.mjs                分类 / 后缀 / 路径配置
│   ├── build-manifest.mjs        扫描图片生成 manifest.json（Vercel 构建时自动跑）
│   ├── normalize-filenames.mjs   批量改名成英文
│   ├── make-placeholders.mjs     生成占位图（首次部署不空白）
│   └── serve.mjs                 本地预览服务器
├── vercel.json                   构建命令 + 缓存 + 安全头
└── package.json
```

## 本地预览

图库靠 `fetch` 读取索引，**直接双击 `index.html` 会被浏览器拦截**，必须用 http 打开：

```bash
npm run dev          # 启动 http://localhost:3000
```

不需要 `npm install`，本项目没有任何第三方依赖。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地预览，端口 3000 |
| `npm run normalize` | **预览**中文名 → 英文名的改名结果（不动文件） |
| `npm run normalize:apply` | 真正执行改名，并同步 `captions.json` 里的键 |
| `npm run build` | 重新扫描图片、生成 `photos/manifest.json` |
| `npm run placeholders` | 重新生成示例占位图 |

## 新增图片（3 步）

1. 把图片放进对应分类目录：`photos/bags` / `photos/scarves` / `photos/watches`
2. 本地执行 `npm run normalize:apply`，把中文名改成英文（网页上传的话可以跳过这步，但**别用中文文件名**）
3. `npm run build` 重建索引 → 刷新页面

推到 GitHub 后，Vercel 会自动跑第 2、3 步的等价流程（`npm run build`），你只需要在 GitHub 网页上把图片传进目录。

## 中文标题怎么显示

文件名必须是英文，但展示可以是中文。编辑 `photos/captions.json`：

```json
{
  "bags-sample-01.svg": "包包 · 示例 01",
  "bags-tote-black-01.jpg": "经典托特包 · 黑"
}
```

键是**完整文件名**（也可省略后缀），值是页面上显示的文字。没有配的图会从文件名自动生成标题。

## 设计改动

配色、圆角、栏数都在 `assets/style.css` 顶部：

```css
:root {
  --bg: #fbfaf8;      /* 页面底色 */
  --ink: #171614;     /* 主文字 */
  --tile: #f4f1ec;    /* 图片底衬 */
  --radius: 8px;      /* 卡片圆角 */
}
```

瀑布流栏数在 `.gallery { column-count: 4; }`，手机端在媒体查询里降为 2 / 1。

## 体积建议

- 单张图压到 **1 MB 以内**、长边 1600px 足够网页展示
- 格式优先 **WebP**（比 JPG 小 30% 左右），其次 JPG
- 不要用 HEIC：浏览器不认，脚本会跳过并提示
- 首页是懒加载的，几百张图不影响首屏速度
