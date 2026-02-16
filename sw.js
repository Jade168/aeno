// sw.js - AENO Service Worker
// Version: 2026-02-16
// 完全兼容GitHub Pages更新，離線可用，對應所有遊戲核心檔案

const CACHE_NAME = "aeno-cache-v20260216";
// 完整緩存列表，補全所有核心遊戲檔案，確保離線可用
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./ai-assistant.js",
  "./characters.js",
  "./ads.json",
  "./manifest.json"
];

// 安裝：緩存所有核心遊戲檔案
self.addEventListener("install", (event) => {
  console.log("[AENO SW] 正在安裝，緩存核心資源");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => console.log("[AENO SW] 核心資源緩存完成"))
      .catch(err => console.error("[AENO SW] 緩存失敗", err))
  );
  // 強制跳過等待，新版本立即生效
  self.skipWaiting();
});

// 激活：清理舊版本緩存，接管所有頁面
self.addEventListener("activate", (event) => {
  console.log("[AENO SW] 正在激活，清理舊緩存");
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          // 只保留當前版本緩存，刪除所有舊版本
          if (k !== CACHE_NAME) {
            console.log("[AENO SW] 刪除舊緩存：", k);
            return caches.delete(k);
          }
        })
      );
    }).then(() => {
      console.log("[AENO SW] 激活完成，已接管所有頁面");
      // 強制接管所有已打開的頁面，無需刷新
      return self.clients.claim();
    })
  );
});

// 請求攔截：網絡優先（GitHub更新友好），失敗則用緩存兜底
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. 只處理GET請求，POST/其他請求直接透傳，不緩存
  if (request.method !== "GET") {
    event.respondWith(fetch(request));
    return;
  }

  // 2. 跨域請求處理（主要是廣告歌音頻文件）
  if (!url.origin.includes(self.location.origin)) {
    // 只緩存音頻文件，其他跨域請求直接透傳
    if (request.url.includes(".mp3") || request.url.includes(".ogg") || request.url.includes(".wav")) {
      event.respondWith(
        fetch(request, { mode: "no-cors" })
          .then(resp => {
            // 跨域音頻響應是不透明的，可緩存但不可讀取內容
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            return resp;
          })
          .catch(() => {
            // 離線時返回已緩存的音頻
            return caches.match(request) || new Response(null, { status: 204 });
          })
      );
    } else {
      // 其他跨域請求直接透傳
      event.respondWith(fetch(request));
    }
    return;
  }

  // 3. 核心邏輯：網絡優先，失敗則用緩存兜底（完全兼容GitHub更新）
  event.respondWith(
    fetch(request)
      .then(resp => {
        // 請求成功，更新緩存
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return resp;
      })
      .catch(() => {
        // 網絡失敗，返回緩存內容
        return caches.match(request)
          .then(cachedResp => {
            if (cachedResp) return cachedResp;
            // 兜底：所有HTML請求失敗都返回主頁，確保單頁應用正常
            if (request.headers.get("accept").includes("text/html")) {
              return caches.match("./index.html");
            }
            // 其他資源失敗返回204空響應，避免報錯
            return new Response(null, { status: 204 });
          });
      })
  );
});
