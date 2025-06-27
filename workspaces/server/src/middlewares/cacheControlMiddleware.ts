import { createMiddleware } from 'hono/factory';

export const cacheControlMiddleware = createMiddleware(async (c, next) => {
  await next();
  
  const url = new URL(c.req.url);
  const path = url.pathname;
  
  // パスに基づいてキャッシュ設定を変更
  if (path.includes('/images/') || path.match(/\.(jpe?g|png|gif|svg|webp|avif|jxl|bmp|css|js)$/i)) {
    // 画像や静的ファイルは長期間キャッシュ
    c.res.headers.set('Cache-Control', 'public, max-age=31536000'); // 1年
  } else if (path.includes('/api/v1/content/')) {
    // コンテンツAPIはより長くキャッシュ
    c.res.headers.set('Cache-Control', 'public, max-age=86400'); // 24時間
  } else if (path.includes('/api/')) {
    // その他のAPIレスポンスは短期間キャッシュ
    c.res.headers.set('Cache-Control', 'public, max-age=60'); // 1分間
  } else {
    // その他は再検証必要なキャッシュ
    c.res.headers.set('Cache-Control', 'public, must-revalidate, proxy-revalidate, max-age=600'); // 10分間
  }
});
