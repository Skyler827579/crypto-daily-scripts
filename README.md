# Crypto Daily Scripts

这是一个独立的加密货币每日行情口播稿知识库项目，不和 ChainPulse 主项目混在一起。

生成逻辑是：

```txt
Codex 自动化每天联网研究行情
→ 写入 content/crypto-daily/YYYY-MM-DD.json
→ npm run build 生成 public 静态站
→ 提交并推送 GitHub
→ Netlify 自动部署 public
```

VPS 不需要 OpenAI API Key，也不负责写稿；VPS 和 Netlify 只负责部署。

## 目录

- `scripts/build_site.mjs`：静态站生成脚本
- `content/crypto-daily/`：每天生成的结构化稿件 JSON
- `public/`：Netlify 发布目录
- `netlify.toml`：Netlify 构建配置

## 每篇稿件固定框架

- 核心结论
- 一针见血的讲述角度
- 辅助观点
- 主要波动
- 热币观察
- 宏观背景
- 技术面观察
- 市场情绪
- 波动原因
- 可讲要点
- 核心数据
- 总结框架
- 风险提示
- 不要怎么讲
- 3-5 分钟中文口播稿
- 备用短视频标题
- 参考来源链接

## 固定分类

市场维度：

- 宏观
- 经济指标
- 美股
- 亚洲市场
- A股港股
- 债市
- 外汇市场
- 黄金白银
- 主流加密货币
- 热币异动
- 监管/ETF

分析维度：

- 市场技术分析
- 情绪分析
- 链上数据
- 每日行情

## 只重新生成静态站

```bash
npm run build
```

## Netlify 部署

1. 新建一个 GitHub 仓库，专门放这个项目；
2. Netlify 新建站点，连接这个仓库；
3. Build command 用 `npm run build`；
4. Publish directory 用 `public`；
5. 之后 Codex 自动化每天提交并推送，Netlify 自动部署。

## Codex 自动化

自动化应该运行在这个项目根目录，每天新增或更新一篇 `content/crypto-daily/YYYY-MM-DD.json`，然后执行：

```bash
npm run build
git add content public
git commit -m "Add crypto daily YYYY-MM-DD"
git push
```
