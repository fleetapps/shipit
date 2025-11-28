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
  // Clean output directory and build info
  const outDir = path.join(projectRoot, 'worker-dist');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  const buildInfoFile = path.join(projectRoot, 'node_modules', '.tmp', 'tsconfig.worker.tsbuildinfo');
  if (fs.existsSync(buildInfoFile)) {
    fs.rmSync(buildInfoFile, { force: true });
  }

  // First, compile TypeScript (use --build --force for composite projects to ensure fresh build)
  console.log('📝 Compiling TypeScript...');
  execSync('pnpm tsc --build --force tsconfig.worker.json', {
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

