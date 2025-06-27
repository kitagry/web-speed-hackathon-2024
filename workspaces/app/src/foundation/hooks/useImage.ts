import { useAsync } from 'react-use';
import { useCallback, useMemo } from 'react';

import { getImageUrl } from '../../lib/image/getImageUrl';

// 画像のキャッシュを保持するグローバルマップ
const imageCache = new Map<string, string>();

export const useImage = ({ height, imageId, width }: { height: number; imageId: string; width: number }) => {
  // キャッシュキーを生成
  const cacheKey = useMemo(() => `${imageId}_${width}_${height}`, [imageId, width, height]);
  
  // キャッシュが存在する場合は、それを返す
  const cachedImage = useMemo(() => imageCache.get(cacheKey), [cacheKey]);
  
  // 画像処理関数をメモ化
  const processImage = useCallback(async () => {
    // キャッシュがあれば、それを返す
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey)!;
    }
    
    const dpr = window.devicePixelRatio;
    
    // サーバーから直接最適なサイズの画像を取得
    const imgUrl = getImageUrl({
      format: 'jpg',
      height: height * dpr,
      imageId,
      width: width * dpr,
    });
    
    // キャッシュに保存して返す
    imageCache.set(cacheKey, imgUrl);
    return imgUrl;
  }, [cacheKey, height, imageId, width]);
  
  // キャッシュがあれば、キャッシュを使用、なければ非同期で取得
  const { value } = useAsync(async () => {
    return cachedImage || processImage();
  }, [cachedImage, processImage]);

  return value;
};
