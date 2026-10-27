/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

function buildId(): string {
  const sha = process.env.VITE_BUILD_ID || process.env.GITHUB_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  // The playtest hub builds each version under its own path, e.g. /voxel-rhythm-game/pr-5/.
  base: process.env.VITE_BASE ?? '/',
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        editor: resolve(import.meta.dirname, 'editor.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
