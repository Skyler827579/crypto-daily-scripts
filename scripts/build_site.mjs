#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "crypto-daily");
const publicDir = path.join(root, "public");
const siteTitle = process.env.SITE_TITLE || "Crypto Daily Scripts";
const siteBaseUrl = (process.env.SITE_BASE_URL || "").replace(/\/$/, "");

await buildSite();
console.log("Static site rebuilt.");

async function buildSite() {
  const posts = await readPosts();
  await fs.rm(publicDir, { recursive: true, force: true });
  await fs.mkdir(path.join(publicDir, "posts"), { recursive: true });
  await fs.mkdir(path.join(publicDir, "categories"), { recursive: true });

  const categories = collectCategories(posts);
  await fs.writeFile(path.join(publicDir, "index.html"), renderIndex(posts, categories));
  await fs.writeFile(path.join(publicDir, "archive.html"), renderArchive(posts));
  await fs.writeFile(path.join(publicDir, "style.css"), css());
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), renderSitemap(posts, categories));

  for (const [category, items] of categories) {
    await fs.writeFile(
      path.join(publicDir, "categories", `${slugify(category)}.html`),
      renderCategory(category, items)
    );
  }

  for (const post of posts) {
    await fs.writeFile(path.join(publicDir, "posts", `${post.slug}.html`), renderPost(post));
  }
}

async function readPosts() {
  const files = await fs.readdir(contentDir).catch(() => []);
  const posts = [];
  for (const file of files.filter((name) => name.endsWith(".json"))) {
    const raw = await fs.readFile(path.join(contentDir, file), "utf8");
    posts.push(normalizePost(JSON.parse(raw)));
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function normalizePost(post) {
  return {
    ...post,
    slug: slugify(post.slug || `${post.date}-${post.title}`),
    categories: post.categories?.length ? post.categories : ["每日行情"],
    tags: post.tags || [],
    video_titles: (post.video_titles || []).slice(0, 5).map((title) => title.slice(0, 8)),
    sources: post.sources || []
  };
}

function renderIndex(posts, categories) {
  const latest = posts[0];
  return page(
    siteTitle,
    `<section class="hero">
      <p class="eyebrow">加密货币每日行情口播稿</p>
      <h1>${escapeHtml(siteTitle)}</h1>
      <p>独立记录每日加密市场波动，结合宏观、技术面、资金流和市场情绪，沉淀成可直接出镜讲解的中文口播稿。</p>
    </section>
    <section class="overview">
      <div><strong>${posts.length}</strong><span>篇稿件</span></div>
      <div><strong>${categories.size}</strong><span>个分类</span></div>
      <div><strong>${latest ? latest.date : "-"}</strong><span>最新更新</span></div>
    </section>
    ${latest ? postCard(latest, true) : `<p class="empty">还没有稿件。</p>`}
    <section>
      <h2>最新稿件</h2>
      <div class="list">${posts.slice(0, 12).map((post) => postCard(post)).join("")}</div>
    </section>`
  );
}

function renderArchive(posts) {
  return page("总目录", `<h1>总目录</h1><div class="list">${posts.map((post) => postCard(post)).join("")}</div>`);
}

function renderCategory(category, posts) {
  return page(
    category,
    `<h1>${escapeHtml(category)}</h1><div class="list">${posts.map((post) => postCard(post)).join("")}</div>`
  );
}

function renderPost(post) {
  return page(
    post.title,
    `<article class="post">
      <p class="eyebrow">${escapeHtml(post.date)} · ${post.categories.map(escapeHtml).join(" / ")}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="hook">${escapeHtml(post.hook)}</p>
      <div class="brief">
        <div><span>核心结论</span><p>${escapeHtml(post.market_one_liner || "")}</p></div>
        <div><span>一针见血</span><p>${escapeHtml(post.sharp_angle || "")}</p></div>
      </div>
      ${section("辅助观点", post.supporting_viewpoints)}
      ${section("主要波动", post.main_moves)}
      ${section("热币观察", post.hot_coins)}
      ${section("宏观背景", post.macro_background)}
      ${section("技术面观察", post.technical_view)}
      ${section("市场情绪", post.sentiment_view)}
      ${section("波动原因", post.reasons)}
      ${section("可讲要点", post.talking_points)}
      ${section("核心数据", post.core_data)}
      ${section("总结框架", post.summary_framework)}
      ${section("风险提示", post.risk_notes)}
      ${section("不要这么讲", post.avoid_angles)}
      <h2>口播稿</h2>
      <div class="script">${escapeHtml(post.script || "").split("\n").filter(Boolean).map((line) => `<p>${line}</p>`).join("")}</div>
      ${section("备用标题", post.video_titles)}
      <h2>参考来源</h2>
      <ol class="sources">${post.sources.map((source) => `<li><a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a><span>${escapeHtml(source.publisher || "")} · ${escapeHtml(source.note || "")}</span></li>`).join("")}</ol>
    </article>`
  );
}

function section(title, items) {
  const safeItems = (items || []).filter(Boolean);
  if (!safeItems.length) return "";
  return `<h2>${escapeHtml(title)}</h2><ul>${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function postCard(post, featured = false) {
  return `<article class="${featured ? "card featured" : "card"}">
    <p class="date">${escapeHtml(post.date)}</p>
    <h2><a href="/posts/${escapeAttr(post.slug)}.html">${escapeHtml(post.title)}</a></h2>
    <p>${escapeHtml(post.market_one_liner || post.hook || "")}</p>
    <div class="tags">${post.categories.map((category) => `<a href="/categories/${slugify(category)}.html">${escapeHtml(category)}</a>`).join("")}</div>
  </article>`;
}

function page(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${escapeHtml(siteTitle)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <a class="brand" href="/">${escapeHtml(siteTitle)}</a>
    <nav><a href="/archive.html">总目录</a></nav>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

function css() {
  return `:root{color-scheme:light;--text:#151515;--muted:#656565;--line:#e4e4e4;--bg:#f8f8f6;--panel:#fff;--accent:#0f766e;--soft:#eef7f5}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.68}header{min-height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid var(--line);background:#fff;position:sticky;top:0;z-index:2}a{color:inherit}.brand{font-weight:800;text-decoration:none}nav a{color:var(--muted);text-decoration:none}main{max-width:1020px;margin:0 auto;padding:32px 20px 72px}.hero{padding:48px 0 34px;border-bottom:1px solid var(--line);margin-bottom:22px}.hero h1{font-size:clamp(34px,5vw,58px);line-height:1.06;margin:8px 0 16px;letter-spacing:0}.hero p{max-width:760px;color:var(--muted);font-size:18px}.eyebrow,.date{color:var(--accent);font-size:14px;font-weight:750}.overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}.overview div{background:#fff;border:1px solid var(--line);border-radius:8px;padding:14px}.overview strong{display:block;font-size:22px}.overview span{color:var(--muted);font-size:13px}.list{display:grid;gap:14px}.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:20px}.card h2{margin:4px 0 8px;font-size:22px;line-height:1.28}.card h2 a{text-decoration:none}.card p{margin:0 0 14px;color:var(--muted)}.featured{border-color:#92cfc7;background:linear-gradient(180deg,#fff,#f8fdfc)}.tags{display:flex;gap:8px;flex-wrap:wrap}.tags a{font-size:13px;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:3px 9px;color:var(--muted);background:#fff}.post{background:#fff;border:1px solid var(--line);border-radius:8px;padding:28px}.post h1{font-size:36px;line-height:1.15;margin:6px 0 16px;letter-spacing:0}.post h2{font-size:20px;margin-top:28px}.hook{font-size:20px;color:#333;border-left:4px solid var(--accent);padding-left:14px}.brief{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:22px 0}.brief div{background:var(--soft);border:1px solid #cfe8e3;border-radius:8px;padding:14px}.brief span{font-size:13px;color:var(--accent);font-weight:800}.brief p{margin:6px 0 0}.script p{margin:0 0 14px}.sources li{margin-bottom:12px}.sources span{display:block;color:var(--muted);font-size:14px}.empty{color:var(--muted)}@media(max-width:700px){header{padding:0 16px}.overview,.brief{grid-template-columns:1fr}.post{padding:20px}.post h1{font-size:30px}}`;
}

function collectCategories(posts) {
  const map = new Map();
  for (const post of posts) {
    for (const category of post.categories) {
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(post);
    }
  }
  return map;
}

function renderSitemap(posts, categories) {
  if (!siteBaseUrl) return "";
  const urls = [
    "",
    "/archive.html",
    ...posts.map((post) => `/posts/${post.slug}.html`),
    ...Array.from(categories.keys()).map((category) => `/categories/${slugify(category)}.html`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${siteBaseUrl}${url}</loc></url>`).join("\n")}
</urlset>`;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "post";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
