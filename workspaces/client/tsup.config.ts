import fs from 'node:fs';
import path from 'node:path';

import { pnpmWorkspaceRoot as findWorkspaceDir } from '@node-kit/pnpm-workspace-root';
// polyfillNodeのimportを削除
import findPackageDir from 'pkg-dir';
import { defineConfig } from 'tsup';
import type { Options } from 'tsup';

export default defineConfig(async (): Promise<Options[]> => {
  const PACKAGE_DIR = (await findPackageDir(process.cwd()))!;
  const WORKSPACE_DIR = (await findWorkspaceDir(process.cwd()))!;

  const OUTPUT_DIR = path.resolve(PACKAGE_DIR, './dist');

  const SEED_IMAGE_DIR = path.resolve(WORKSPACE_DIR, './workspaces/server/seeds/images');
  const IMAGE_PATH_LIST = fs.readdirSync(SEED_IMAGE_DIR).map((file) => `/images/${file}`);

  return [
    {
      bundle: true,
      clean: true,
      entry: {
        admin: path.resolve(PACKAGE_DIR, './src/admin.tsx'),
        client: path.resolve(PACKAGE_DIR, './src/index.tsx'),
        serviceworker: path.resolve(PACKAGE_DIR, './src/serviceworker/index.ts'),
      },
      env: {
        API_URL: '',
        NODE_ENV: process.env['NODE_ENV'] || 'production',
        PATH_LIST: IMAGE_PATH_LIST.join(',') || '',
      },
      esbuildOptions(options) {
        options.define = {
          ...options.define,
          global: 'globalThis',
        };
        options.publicPath = '/';
      },
      // 不要なpolyfillNodeを削除
      format: 'iife',
      loader: {
        '.json?file': 'file',
        '.wasm': 'binary',
      },
      metafile: true,
      minify: true,
      outDir: OUTPUT_DIR,
      platform: 'browser',
      shims: true,
      sourcemap: false,
      splitting: true,
      target: ['chrome58'],
      treeshake: true,
    },
  ];
});
