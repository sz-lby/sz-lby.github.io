/* ============================================================
   博客交互逻辑（列表页 + 详情页共用）
   依赖：articles.js（window.ARTICLES）、marked.min.js
   ============================================================ */

(function () {
  "use strict";

  // marked 配置：换行视为换行、开启 GFM
  if (window.marked && typeof marked.setOptions === "function") {
    marked.setOptions({ gfm: true, breaks: true });
  }

  const SRC = window.ARTICLES || [];
  // 按发布日期降序排列，新文章自动置顶
  const ARTICLES = [...SRC].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------- 列表页 ---------------- */
  function renderListPage() {
    const grid = $("#card-grid");
    const tagBar = $("#tag-bar");
    const searchInput = $("#search-input");
    if (!grid) return;

    // 收集全部标签
    const allTags = [];
    ARTICLES.forEach((a) => a.tags.forEach((t) => {
      if (!allTags.includes(t)) allTags.push(t);
    }));

    let activeTag = "全部";
    let keyword = "";

    function buildTagBar() {
      if (!tagBar) return;
      const tags = ["全部", ...allTags];
      tagBar.innerHTML = tags
        .map((t) => `<button class="tag-chip${t === activeTag ? " active" : ""}" data-tag="${t}">${t}</button>`)
        .join("");
      $$(".tag-chip", tagBar).forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTag = btn.dataset.tag;
          buildTagBar();
          paint();
        });
      });
    }

    function paint() {
      const list = ARTICLES.filter((a) => {
        const okTag = activeTag === "全部" || a.tags.includes(activeTag);
        const okKw =
          !keyword ||
          a.title.toLowerCase().includes(keyword) ||
          a.excerpt.toLowerCase().includes(keyword) ||
          a.tags.join(" ").toLowerCase().includes(keyword);
        return okTag && okKw;
      });

      if (!list.length) {
        grid.innerHTML = `<div class="empty">😶 没有找到相关文章，换个标签或关键词试试～</div>`;
        return;
      }

      grid.innerHTML = list
        .map(
          (a) => `
        <article class="card">
          <div class="thumb">${a.thumb || "📄"}</div>
          <div class="body">
            <h3><a href="article.html?id=${a.id}">${a.title}</a></h3>
            <p class="excerpt">${a.excerpt}</p>
            <div class="meta">
              <div class="tags">${a.tags
                .map((t) => `<span class="mini-tag">${t}</span>`)
                .join("")}</div>
              <span class="date">${a.date}</span>
            </div>
          </div>
        </article>`
        )
        .join("");
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        keyword = e.target.value.trim().toLowerCase();
        paint();
      });
    }

    buildTagBar();
    paint();

    // 文章计数
    const countEl = $("#article-count");
    if (countEl) countEl.textContent = ARTICLES.length;
  }

  /* ---------------- 详情页 ---------------- */
  function renderDetailPage() {
    const root = $("#article-root");
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const article = ARTICLES.find((a) => a.id === id);

    if (!article) {
      root.innerHTML = `<div class="empty">😢 没有找到这篇文章，<a href="index.html">返回首页</a></div>`;
      return;
    }

    // 标题与元信息
    document.title = article.title + " · 用电安全与合法用电";
    const header = $("#article-header");
    if (header) {
      header.innerHTML = `
        <a class="back-link" href="index.html">← 返回文章列表</a>
        <div class="tags">${article.tags
          .map((t) => `<a class="mini-tag" href="index.html">${t}</a>`)
          .join("")}</div>
        <h1>${article.title}</h1>
        <div class="meta-info">
          <span>📅 发布于 ${article.date}</span>
          <span>⏱ 阅读约 ${Math.max(2, Math.round(article.content.length / 350))} 分钟</span>
        </div>`;
    }

    // Markdown 渲染
    const md = window.marked ? marked.parse(article.content) : article.content;
    root.innerHTML = md;

    // 渲染相关文章（同标签）
    const related = ARTICLES.filter(
      (a) => a.id !== article.id && a.tags.some((t) => article.tags.includes(t))
    ).slice(0, 3);
    const relBox = $("#related");
    if (relBox) {
      if (!related.length) {
        relBox.style.display = "none";
      } else {
        relBox.innerHTML =
          `<h2 class="section-head" style="margin-top:0"><span class="bar"></span>相关推荐</h2>` +
          `<div class="card-grid">` +
          related
            .map(
              (a) => `
            <article class="card">
              <div class="thumb">${a.thumb || "📄"}</div>
              <div class="body">
                <h3><a href="article.html?id=${a.id}">${a.title}</a></h3>
                <p class="excerpt">${a.excerpt}</p>
                <div class="meta">
                  <div class="tags">${a.tags
                    .map((t) => `<span class="mini-tag">${t}</span>`)
                    .join("")}</div>
                  <span class="date">${a.date}</span>
                </div>
              </div>
            </article>`
            )
            .join("") +
          `</div>`;
      }
    }
  }

  /* ---------------- 暗色模式 ---------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $$(".theme-toggle").forEach((btn) => {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", theme === "dark" ? "切换到亮色模式" : "切换到暗色模式");
    });
  }
  function initTheme() {
    let theme = localStorage.getItem("theme");
    if (!theme) {
      const sysDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      theme = sysDark ? "dark" : "light";
    }
    applyTheme(theme);
  }
  function bindThemeToggle() {
    $$(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next =
          document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        localStorage.setItem("theme", next);
        applyTheme(next);
        syncGiscusTheme(next);
      });
    });
  }
  function syncGiscusTheme(theme) {
    const iframe = document.querySelector("iframe.giscus-frame");
    if (iframe) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme } } },
        "https://giscus.app"
      );
    }
  }
  function loadGiscus() {
    const box = document.getElementById("giscus");
    if (!box || box.dataset.loaded) return;
    box.dataset.loaded = "1";
    const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.setAttribute("data-repo", "sz-lby/sz-lby.github.io");
    s.setAttribute("data-repo-id", "1316980589");
    s.setAttribute("data-category", "Announcements");
    s.setAttribute("data-category-id", "DIC_kwDOTn-Hbc4DCT69");
    s.setAttribute("data-mapping", "url");
    s.setAttribute("data-strict", "0");
    s.setAttribute("data-reactions-enabled", "1");
    s.setAttribute("data-emit-metadata", "0");
    s.setAttribute("data-input-position", "bottom");
    s.setAttribute("data-theme", theme);
    s.setAttribute("data-lang", "zh-CN");
    s.setAttribute("crossorigin", "anonymous");
    s.async = true;
    box.appendChild(s);
  }

  /* ---------------- 移动端导航 ---------------- */
  function bindNav() {
    const toggle = $(".nav-toggle");
    const links = $(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("open"));
      $$("a", links).forEach((a) =>
        a.addEventListener("click", () => links.classList.remove("open"))
      );
    }
  }

  /* ---------------- 启动 ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    bindNav();
    bindThemeToggle();
    renderListPage();
    renderDetailPage();
    loadGiscus();
  });
})();
