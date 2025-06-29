import { createReadStream, existsSync } from 'node:fs';
import type { ReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Image } from 'image-js';
import { z } from 'zod';

import { IMAGES_PATH } from '../../constants/paths';

// リサイズされた画像のキャッシュディレクトリ
const CACHE_PATH = path.resolve(process.cwd(), 'cache', 'resized_images');

// キャッシュディレクトリが存在しない場合は作成
try {
  if (!existsSync(CACHE_PATH)) {
    mkdir(CACHE_PATH, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create cache directory:', error);
}
import type { ConverterInterface } from '../../image-converters/ConverterInterface';
import { avifConverter } from '../../image-converters/avifConverter';
import { jpegConverter } from '../../image-converters/jpegConverter';
import { jpegXlConverter } from '../../image-converters/jpegXlConverter';
import { pngConverter } from '../../image-converters/pngConverter';
import { webpConverter } from '../../image-converters/webpConverter';

const createStreamBody = (stream: ReadStream) => {
  const body = new ReadableStream({
    cancel() {
      stream.destroy();
    },
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on('end', () => {
        controller.close();
      });
    },
  });

  return body;
};

const SUPPORTED_IMAGE_EXTENSIONS = ['jxl', 'avif', 'webp', 'png', 'jpeg', 'jpg'] as const;

type SupportedImageExtension = (typeof SUPPORTED_IMAGE_EXTENSIONS)[number];

function isSupportedImageFormat(ext: unknown): ext is SupportedImageExtension {
  return (SUPPORTED_IMAGE_EXTENSIONS as readonly unknown[]).includes(ext);
}

const IMAGE_MIME_TYPE: Record<SupportedImageExtension, string> = {
  ['avif']: 'image/avif',
  ['jpeg']: 'image/jpeg',
  ['jpg']: 'image/jpeg',
  ['jxl']: 'image/jxl',
  ['png']: 'image/png',
  ['webp']: 'image/webp',
};

const IMAGE_CONVERTER: Record<SupportedImageExtension, ConverterInterface> = {
  ['avif']: avifConverter,
  ['jpeg']: jpegConverter,
  ['jpg']: jpegConverter,
  ['jxl']: jpegXlConverter,
  ['png']: pngConverter,
  ['webp']: webpConverter,
};

const app = new Hono();

// キャッシュファイル名を生成する関数
function getCacheFilePath(imageId: string, format: string, width?: number, height?: number): string {
  const sizeStr = width || height ? `_${width || 'auto'}x${height || 'auto'}` : '';
  return path.join(CACHE_PATH, `${imageId}${sizeStr}.${format}`);
}

app.get(
  '/images/:imageFile',
  zValidator(
    'param',
    z.object({
      imageFile: z.string().regex(/^[a-f0-9-]+(?:\.\w*)?$/),
    }),
  ),
  zValidator(
    'query',
    z.object({
      format: z.string().optional(),
      height: z.coerce.number().optional(),
      width: z.coerce.number().optional(),
    }),
  ),
  async (c) => {
    const { globby } = await import('globby');

    const { ext: reqImgExt, name: reqImgId } = path.parse(c.req.valid('param').imageFile);

    const resImgFormat = c.req.valid('query').format ?? reqImgExt.slice(1);

    if (!isSupportedImageFormat(resImgFormat)) {
      throw new HTTPException(501, { message: `Image format: ${resImgFormat} is not supported.` });
    }

    const reqImageSize = c.req.valid('query');
    const width = reqImageSize.width;
    const height = reqImageSize.height;

    // リサイズが必要な場合、キャッシュファイルをチェック
    if (width != null || height != null) {
      const cacheFilePath = getCacheFilePath(reqImgId, resImgFormat, width, height);

      // キャッシュがあればそれを返す
      if (existsSync(cacheFilePath)) {
        c.header('Content-Type', IMAGE_MIME_TYPE[resImgFormat]);
        c.header('Cache-Control', 'public, max-age=31536000'); // 1年間キャッシュ
        return c.body(createStreamBody(createReadStream(cacheFilePath)));
      }
    }

    const origFileGlob = [path.resolve(IMAGES_PATH, `${reqImgId}`), path.resolve(IMAGES_PATH, `${reqImgId}.*`)];
    const [origFilePath] = await globby(origFileGlob, { absolute: true, onlyFiles: true });
    if (origFilePath == null) {
      throw new HTTPException(404, { message: 'Not found.' });
    }

    const origImgFormat = path.extname(origFilePath).slice(1);
    if (!isSupportedImageFormat(origImgFormat)) {
      throw new HTTPException(500, { message: 'Failed to load image.' });
    }

    // リサイズやフォーマット変換が不要な場合はそのまま返す
    if (resImgFormat === origImgFormat && width == null && height == null) {
      c.header('Content-Type', IMAGE_MIME_TYPE[resImgFormat]);
      c.header('Cache-Control', 'public, max-age=31536000'); // 1年間キャッシュ
      return c.body(createStreamBody(createReadStream(origFilePath)));
    }

    const origBinary = await fs.readFile(origFilePath);
    const image = new Image(await IMAGE_CONVERTER[origImgFormat].decode(origBinary));

    // スケール計算
    const scale = Math.max((width ?? 0) / image.width, (height ?? 0) / image.height) || 1;

    // サイズ計算
    const newWidth = width ? Math.ceil(width) : Math.ceil(image.width * scale);
    const newHeight = height ? Math.ceil(height) : Math.ceil(image.height * scale);

    // リサイズ処理
    const manipulated = image.resize({
      height: newHeight,
      preserveAspectRatio: true,
      width: newWidth,
    });

    // エンコード
    const resBinary = await IMAGE_CONVERTER[resImgFormat].encode({
      colorSpace: 'srgb',
      data: new Uint8ClampedArray(manipulated.data),
      height: manipulated.height,
      width: manipulated.width,
    });

    // リサイズ結果をキャッシュする
    if (width != null || height != null) {
      try {
        const cacheFilePath = getCacheFilePath(reqImgId, resImgFormat, width, height);
        await fs.writeFile(cacheFilePath, resBinary);
      } catch (error) {
        console.error('Failed to write cache file:', error);
      }
    }

    c.header('Content-Type', IMAGE_MIME_TYPE[resImgFormat]);
    c.header('Cache-Control', 'public, max-age=31536000'); // 1年間キャッシュ
    return c.body(resBinary);
  },
);

export { app as imageApp };
