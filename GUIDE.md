# 操作教程：从代码包到线上图库

全程只需要浏览器 + 一个 GitHub 账号 + 一个 Vercel 账号。**不需要服务器、不需要域名、不需要花钱。**
下面每一步都标了「这一步容易踩的坑」，遇到问题先看第 7 节的排查表。

预计耗时：首次 20～30 分钟（不含图片压缩），之后每次更新 3 分钟。

---

## 0. 开始之前

| 准备项 | 说明 |
| --- | --- |
| GitHub 账号 | 注册地址 github.com，邮箱验证一下 |
| Vercel 账号 | vercel.com，**直接用 GitHub 账号登录**，省掉一次绑定 |
| 图片 | 建议先压缩：单张 ≤ 1 MB，长边 1600px，格式 JPG 或 WebP |
| Node.js（可选） | 想用改名 / 本地预览脚本才需要，18 以上 |

> 强烈建议装 Git 和 Node：改名脚本是本项目最省事的环节。纯网页操作也能跑通，只是改名要手动做。

---

## 1. 把代码变成你自己的 GitHub 仓库

两条路，二选一。

### 方式 A：纯网页，不装任何软件

1. 打开 https://github.com/new
2. **Repository name** 填 `simple-photo-gallery`
3. 选 **Public**（Private 也能部署 Vercel，但免费版协作受限）
4. **不要**勾选 "Add a README file"、".gitignore"、license（勾了后面传文件会冲突）
5. 点 **Create repository**
6. 进入空仓库页面，点 **uploading an existing file** 链接
7. 把本地 `simple-photo-gallery` 文件夹里的**所有内容**拖进浏览器（要包含 `assets`、`photos`、`scripts` 这些子目录，GitHub 会保留目录结构）
8. 底部 Commit changes 填 `init: gallery`，点 **Commit changes**

> **坑 1-A**：`.gitignore`、`.env` 这类点开头的文件，Windows 资源管理器默认隐藏，拖拽时可能漏传。本项目不依赖 `.gitignore`（没有 node_modules），漏了不影响部署。
>
> **坑 1-B**：拖整个文件夹时如果只传上来一个文件夹套文件夹（变成 `simple-photo-gallery/simple-photo-gallery/index.html`），Vercel 会找不到 `index.html`。正确结果是仓库根目录**直接**能看到 `index.html`。

### 方式 B：本地 Git 推送（推荐，后续更新更顺）

在代码包目录里执行：

```bash
git init -b main
git add .
git commit -m "init: gallery"
git remote add origin https://github.com/<你的用户名>/simple-photo-gallery.git
git push -u origin main
```

> **坑 1-C**：首次 commit 报 `Please tell me who you are`，先配身份：
> `git config --global user.name "名字"` 和 `git config --global user.email "邮箱"`。
>
> **坑 1-D**：push 要求输入密码且一直失败——GitHub 已不支持账号密码，要用 **Personal Access Token**（Settings → Developer settings → Tokens (classic) → Generate new token，勾 `repo`），密码框粘贴 token。

### 方式 C：Fork（用于"以模板仓库为起点"）

如果你拿到的是一份已经放上 GitHub 的模板仓库：

1. 打开模板仓库页面 → 右上角 **Fork** → **Create fork**
2. Fork 出来的仓库归你所有，可以随意改
3. 想改仓库名：**Settings → Rename**，改完 GitHub 会自动重定向旧地址

> **坑 1-E**：Fork 的仓库默认**不能直接改上游**，但你能改自己这份，Vercel 也认 Fork 仓库，没影响。
> **坑 1-F**：Fork 后如果上游有更新，Fork 不会自动同步。本项目的模板不会再更新，可以忽略。

---

## 2. 上传商品图

目录是固定的三分类，**别新建中文目录**：

| 分类 | 目录 | 页面显示 |
| --- | --- | --- |
| 包包 | `photos/bags/` | 包包 |
| 围巾 | `photos/scarves/` | 围巾 |
| 手表 | `photos/watches/` | 手表 |

网页上传步骤：

1. 打开仓库 → 点进 `photos/bags`
2. 右上角 **Add file → Upload files**
3. 把图片拖进去 → Commit changes
4. 其余两个分类重复

> **坑 2-A**：网页上传**单个文件最大 25 MB，一次最多 100 个文件**。超出就分批传，或先用本地 Git 推送。
> **坑 2-B**：图片必须直接放在 `photos/bags/` 下。放成 `photos/bags/新款/1.jpg` 会被脚本跳过，页面上看不到。
> **坑 2-C**：iPhone 的 `.HEIC` 浏览器不认，必须先在手机「设置 → 相机 → 格式 → 兼容性最佳」或导出成 JPG。
> **坑 2-D**：`photos/bags` 里自带的 `bags-sample-01.svg` 等是占位图，正式使用前删掉它们（点文件名 → 右上角垃圾桶 → Commit）。

---

## 3. 把图片文件名改成英文 + 数字

**这一步是部署失败的头号原因**，务必做完再推。

### 有 Node.js（推荐，一条命令）

把图片放到本地 `photos/` 对应目录后，在项目根目录执行：

```bash
npm run normalize        # 先预览：看清楚每个文件会改成什么
npm run normalize:apply  # 确认无误，真正改名
npm run build            # 重建索引
```

脚本做的事：

| 原始文件名 | 结果 |
| --- | --- |
| `黑色真皮手提包 01.JPG` | `bags-black-leather-tote-01.jpg` |
| `女包 斜挎包（小号）#2.png` | `bags-handbag-crossbody-small-2.png` |
| `羊绒围巾-米白色 新款.jpg` | `scarves-cashmere-scarf-beige-new.jpg` |
| `IMG 20231105 001.jpg` | `watches-img-20231105-001.jpg` |
| `手表表带.HEIC` | 跳过并提示（HEIC 不支持） |

规则：中文按内置词表翻译 → 残留中文删除 → 空格 / 括号 / `#` / 全角符号统一变 `-` → 全部小写 → 自动加分类前缀 → 重名自动加 `-2`。重复执行不会二次改名。

词表在 `scripts/normalize-filenames.mjs` 顶部 `ZH_MAP`，遇到没翻译的品类词自己加一行即可。

### 没有 Node.js（手动）

上传前，自己把文件名改成这个样式，命名字符只用 `a-z 0-9 -`：

```
bags-tote-black-01.jpg
scarves-cashmere-beige-01.jpg
watches-mechanical-rose-gold-01.jpg
```

> **坑 3-A**：Windows 批量重命名会生成 `图片 (1).jpg` 这种**带空格和括号**的名字，照样会出问题。必须把空格和括号也去掉。
> **坑 3-B**：改名后忘了 `npm run build`，页面还是旧索引。构建脚本会读 `photos` 目录，别只改文件不改索引。
> **坑 3-C**：中文名在本地看似正常，是因为 Windows 不区分大小写、且会自动做 URL 编码转换；Linux 构建机严格匹配，所以本地好好的、线上 404。**统一改用英文名最省心。**

---

## 4. Vercel 授权并导入仓库

1. 打开 https://vercel.com ，点 **Continue with GitHub** 登录
2. 进入 Dashboard → **Add New… → Project**
3. 左侧 **Import Git Repository** 列表里找到 `simple-photo-gallery`
   - 如果列表是空的，点 **Adjust GitHub App Permissions**（或 Configure GitHub App）→ 在 GitHub 页面选择 **Only select repositories** → 勾上这个仓库 → **Install**
4. 点 **Import**
5. Configure Project 页面：

| 配置项 | 填什么 |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | 不动（`./`） |
| Build Command | 保持默认（`vercel.json` 已指定 `npm run build`） |
| Output Directory | 保持默认（`vercel.json` 已指定 `.`） |
| Environment Variables | 不填，本项目没有密钥 |

6. 点 **Deploy**，等 30～60 秒

> **坑 4-A**：导入列表里看不到仓库，99% 是 GitHub App 授权时选了 "All repositories" 之外的错误范围。回到 Vercel → Settings → Integrations → GitHub → Configure，重新勾选仓库。
> **坑 4-B**：仓库是刚才 Fork 的，也照样能导入，Vercel 不区分原创还是 Fork。
> **坑 4-C**：**不要**手动把 Build Command 改成 `npm install && npm run build`。构建脚本零依赖，多一条 `npm install` 只会让构建变慢，还可能在没 `package-lock.json` 时报警告。

---

## 5. 部署完成后的验证清单

逐条过一遍，全绿就说明图库是好的：

1. Vercel 项目页顶部状态显示 **Ready**（不是 Error / Building）
2. 点 **Visit** 打开 `https://<项目名>.vercel.app`，能看到图片卡片和「全部 / 包包 / 围巾 / 手表」四个筛选
3. 直接访问 `https://<项目名>.vercel.app/photos/manifest.json`，返回一段 JSON，`total` 等于你实际图片数量
4. 点任意一张图能放大，按 `←` `→` 切换，`Esc` 关闭
5. 把浏览器窗口拉窄，栏数从 4 列变 2 列，没有横向滚动条

> **坑 5-A**：页面显示「图库还是空的」，但图片明明传了 —— 打开 `manifest.json` 看 `total`。是 `0` 说明图片没被扫描到，检查是否放错层级（见坑 2-B）、是否是 `.HEIC`。
> **坑 5-B**：Vercel 分配的 `xxx.vercel.app` 域名在国内偶尔解析不稳。想稳定就绑自有域名，或在 Vercel → Settings → Domains 添加域名后，去域名服务商加一条 `CNAME` 记录指向 `cname.vercel-dns.com`（根域名用 `A` 记录 `76.76.21.21`）。

---

## 6. 后续新增图片（日常流程）

### 纯网页版（3 分钟）

1. 脑子里先定好文件名：`bags-tote-black-02.jpg` 这样的英文名
2. 进仓库 `photos/bags` → **Add file → Upload files** → 拖图 → Commit
3. 回到 Vercel，项目会自动开始一次新部署（Deployments 里出现新记录）
4. 等状态变 Ready，刷新线上页面

> Vercel 在推送到 `main` 分支时会**自动**重新构建，构建时自动重新扫描目录、更新 `manifest.json`，你不需要手动改任何 JSON。

### 本地版

```bash
cp ~/Downloads/*.jpg photos/bags/     # 放图
npm run normalize:apply               # 改名
npm run build                         # 重建索引
git add -A && git commit -m "add: bags 12 张" && git push
```

### 想显示中文标题

编辑 `photos/captions.json`，文件名 → 中文：

```json
{
  "bags-tote-black-02.jpg": "经典托特包 · 黑 · 2024 新款"
}
```

> **坑 6-A**：**换图不要用同名文件**。同名覆盖后，图片的 CDN 缓存最长 7 天（见 `vercel.json` 里的 `max-age=604800`），可能一段时间里仍显示旧图。稳妥做法是加版本后缀：`bags-tote-black-02-v2.jpg`。
> **坑 6-B**：删除图片同样要提交 commit，删完刷新线上才会消失。
> **坑 6-C**：图片总量别贪多。GitHub 单仓库建议控制在 1 GB 内，几百张压缩后的商品图完全没问题。

---

## 7. 踩坑排查表

### 7.1 GitHub 国内访问慢 / 打不开

| 现象 | 原因 | 解决办法 |
| --- | --- | --- |
| github.com 转圈、加载不出图片 | 国内 DNS 污染 + 连接被限速 | ① 装 **Watt Toolkit**（原 Steam++）勾选 GitHub 加速；② 有代理就开全局；③ 手机开热点往往能通 |
| `git clone` / `push` 卡在 `Resolving deltas` | 同上 | 用 **GitHub Desktop** 客户端（连不上时它会有更好提示）；或给 Git 配代理：`git config --global http.proxy http://127.0.0.1:7890` |
| 网页上传图片一半失败 | 单次上传体积过大或断流 | 每批控制在 20 张以内；单张先压到 1 MB 以内 |
| Vercel 后台能打开但 `vercel.app` 打不开 | 该域名在国内部分网络被干扰 | 绑自有域名（见坑 5-B）；或给域名套 Cloudflare 代理 |
| 实在加载不出 GitHub 网页 | 本机网络策略 | 先用手机 4G 热点把图传上去，图库本身不依赖你的网络 |

### 7.2 文件名相关

| 现象 | 原因 | 解决办法 |
| --- | --- | --- |
| 线上图片 404，但文件明明在仓库里 | 中文 / 空格被 URL 编码成 `%E5%8C%85...`，与代码里的路径不一致 | 跑 `npm run normalize:apply`，或手动改成纯英文 |
| 本地正常，线上 404 | Windows 不区分大小写，Linux 区分 | 文件名和引用一律小写 |
| 图片位置串了 / 少了几张 | 文件名重复，后传的覆盖了先传的 | 加序号 `-01` `-02` 区分 |
| 个别图不显示 | `.HEIC` / `.tif` / `.psd` 浏览器不支持 | 转成 JPG / PNG / WebP |
| 报 `File name too long` | 文件名超过约 100 字符 | 缩短，只保留品类 + 颜色 + 序号 |
| 文件名带 `#`，链接被截断 | `#` 在 URL 里是锚点 | 去掉 `#`，用 `-` 代替 |

### 7.3 Vercel 构建失败

| 报错 | 原因 | 解决办法 |
| --- | --- | --- |
| `No Output Directory named "." found` | 少数情况下 Vercel 不接受根目录作为产物目录 | 项目 Settings → Build & Development Settings：**Build Command 清空**、**Output Directory 清空**，改成"纯静态直接发布"；同时本地先跑一次 `npm run build` 并把 `photos/manifest.json` 一起提交 |
| `Command "npm run build" exited with 1` | 脚本报错（多为 `photos` 目录结构异常） | 看 Deployments → 那次部署 → Building 日志的最后 20 行，会打印具体哪个文件出问题 |
| `No matching export` / `Cannot find module` | 有人删了 `scripts/` 里的文件还留着 `npm run build` | 恢复 `scripts/build-manifest.mjs`，或清空 Build Command |
| 构建成功但页面空白 | 图片没被扫描到，`total` 为 0 | 见坑 5-A |
| 构建超时 | 图片总量太大（数百 MB） | 压缩图片，或把原图放在别处只传展示尺寸 |
| 部署成功但图片 404 | 文件名含中文 / 大写 | 见 7.2 |

### 7.4 展示异常

| 现象 | 原因 | 解决办法 |
| --- | --- | --- |
| 双击 `index.html` 打开是白屏 | 浏览器禁止 `file://` 下的 fetch | 用 `npm run dev`（http://localhost:3000），或直接看线上版本 |
| 有的图高度不齐、参差不齐 | 瀑布流按原图比例排列，属正常 | 商品图统一裁成 3:4 或 1:1 会更齐 |
| 手机上筛选条挤在一起 | 窄屏下筛选条可横向滑动 | 正常行为，左右滑动即可 |
| 中文标题没生效 | `captions.json` 里键写错（必须完全等于文件名） | 复制文件名粘贴进去，注意别带空格 |

---

## 8. 命令速查

```bash
npm run dev              # 本地预览 http://localhost:3000
npm run normalize        # 预览改名结果（不动文件）
npm run normalize:apply  # 执行改名
npm run build            # 重新生成 photos/manifest.json
npm run placeholders     # 重新生成占位图
```

## 9. 想改东西去哪找

| 想改 | 文件 | 位置 |
| --- | --- | --- |
| 站点标题 / 副标题 | `index.html` | `<title>`、`.brand`、`.tagline` |
| 分类名称和顺序 | `scripts/config.mjs` | `CATEGORIES` 数组（改完记得 `npm run build`） |
| 新增一个分类 | `scripts/config.mjs` + 新建目录 | 加 `{ id: 'belts', label: '腰带' }`，再建 `photos/belts/` |
| 配色 / 圆角 | `assets/style.css` | `:root` 里的变量 |
| 每行几张图 | `assets/style.css` | `.gallery { column-count }` |
| 图片缓存时长 | `vercel.json` | `max-age` |
| 中文标题 | `photos/captions.json` | 文件名 → 标题 |
