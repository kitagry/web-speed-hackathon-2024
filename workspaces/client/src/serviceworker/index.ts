/// <reference types="@types/serviceworker" />

import { transformJpegXLToBmp } from './transformJpegXLToBmp';

// キャッシュ名を定義
const CACHE_NAME = 'cyber-toon-v1';

self.addEventListener('install', (ev: ExtendableEvent) => {
  ev.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (ev: ExtendableEvent) => {
  // 古いキャッシュを削除
  ev.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev: FetchEvent) => {
  ev.respondWith(onFetch(ev.request));
});

async function onFetch(request: Request): Promise<Response> {
  // キャッシュをチェック
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const res = await fetch(request);
  const contentType = res.headers.get('Content-Type') || '';
  
  // レスポンスをクローンしてキャッシュ可能にする関数
  const cacheResponse = (response: Response): Response => {
    // レスポンスをクローン
    const responseToCache = response.clone();
    
    // 画像などのキャッシュ可能なリソースをキャッシュ
    if (request.method === 'GET' && contentType.includes('image')) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseToCache);
      });
    }
    
    return response;
  };

  if (contentType === 'image/jxl') {
    // JPEG XL形式はサポートされていないため、PNGに変換
    const transformedResponse = await transformJpegXLToBmp(res);
    return cacheResponse(transformedResponse);
  } else {
    return cacheResponse(res);
  }
}
