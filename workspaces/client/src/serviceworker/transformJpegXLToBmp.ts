// @ts-expect-error - This is a workaround for the missing type definition
import jsquashWasmBinary from '@jsquash/jxl/codec/dec/jxl_dec.wasm';
import { init as jsquashInit } from '@jsquash/jxl/decode';
import 'jimp';

declare const Jimp: typeof import('jimp');

// メモリキャッシュを保持する
const imageCache = new Map<string, ArrayBuffer>();

export async function transformJpegXLToBmp(response: Response): Promise<Response> {
  const url = response.url;
  
  // キャッシュに存在すれば、それを返す
  if (imageCache.has(url)) {
    return new Response(imageCache.get(url), {
      headers: {
        'Cache-Control': 'max-age=86400',
        'Content-Type': 'image/png',
      },
    });
  }

  const { decode } = await jsquashInit(undefined, {
    locateFile: () => {},
    wasmBinary: jsquashWasmBinary,
  });

  const imageData = decode(await response.arrayBuffer())!;
  const pngBinary = await new Jimp(imageData).getBufferAsync(Jimp.MIME_PNG);
  
  // キャッシュに保存
  imageCache.set(url, pngBinary);

  return new Response(pngBinary, {
    headers: {
      'Cache-Control': 'max-age=86400',
      'Content-Type': 'image/png',
    },
  });
}
