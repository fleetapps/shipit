#!/usr/bin/env node
/**
 * Build script for worker that resolves TypeScript path aliases
 * This runs before wrangler deploy to resolve path mappings
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

console.log('🔨 Building worker with path resolution...');

try {
  // Clean output directory
  const outDir = path.join(projectRoot, 'worker-dist');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  // First, compile TypeScript
  console.log('📝 Compiling TypeScript...');
  execSync('pnpm tsc -p tsconfig.worker.json', {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  // Then resolve path aliases
  console.log('🔗 Resolving path aliases...');
  execSync('pnpm tsc-alias -p tsconfig.worker.json', {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  console.log('✅ Worker build complete');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

