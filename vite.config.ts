// import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import os from 'os';

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

// Check if Cloudflare plugin should be enabled
// Disable if:
// 1. Explicitly disabled via environment variable
// 2. macOS version is too old (< 13.5.0 required for workerd)
function shouldEnableCloudflare(): boolean {
	// Check explicit disable flag
	if (process.env.DISABLE_CLOUDFLARE_PLUGIN === 'true') {
		return false;
	}

	// Check macOS version
	if (process.platform === 'darwin') {
		const osVersion = os.release();
		const majorVersion = parseInt(osVersion.split('.')[0], 10);
		const minorVersion = parseInt(osVersion.split('.')[1] || '0', 10);
		
		// macOS 13.5.0+ required (version 22.x = macOS 13, version 23.x = macOS 14, etc.)
		// macOS 12 = version 21.x, macOS 13 = version 22.x
		// We need at least version 22.5 (macOS 13.5)
		if (majorVersion < 22 || (majorVersion === 22 && minorVersion < 5)) {
			console.warn(
				'⚠️  Cloudflare Workers runtime requires macOS 13.5.0+ (detected: macOS ' +
				`${majorVersion - 9}.${minorVersion}). Disabling Cloudflare plugin. ` +
				'Frontend will run, but backend API calls will fail until backend is configured.'
			);
			return false;
		}
	}

	return true;
}

const enableCloudflare = shouldEnableCloudflare();

// https://vite.dev/config/
export default defineConfig({
	optimizeDeps: {
		exclude: ['format', 'editor.all'],
		include: ['monaco-editor/esm/vs/editor/editor.api'],
		force: true,
	},

	// build: {
	//     rollupOptions: {
	//       output: {
	//             advancedChunks: {
	//                 groups: [{name: 'vendor', test: /node_modules/}]
	//             }
	//         }
	//     }
	// },
	plugins: [
		react(),
		svgr(),
		// Conditionally enable Cloudflare plugin
		...(enableCloudflare
			? [
					cloudflare({
						configPath: 'wrangler.jsonc',
					}),
				]
			: []),
		tailwindcss(),
		// sentryVitePlugin({
		// 	org: 'cloudflare-0u',
		// 	project: 'javascript-react',
		// }),
	],

	resolve: {
		alias: {
			debug: 'debug/src/browser',
			'@': path.resolve(__dirname, './src'),
			'shared': path.resolve(__dirname, './shared'),
			'worker': path.resolve(__dirname, './worker'),
		},
	},

	// Configure for Prisma + Cloudflare Workers compatibility
	define: {
		// Ensure proper module definitions for Cloudflare Workers context
		'process.env.NODE_ENV': JSON.stringify(
			process.env.NODE_ENV || 'development',
		),
		global: 'globalThis',
		// '__filename': '""',
		// '__dirname': '""',
	},

	worker: {
		// Handle Prisma in worker context for development
		format: 'es',
	},

	server: {
		allowedHosts: true,
	},

	// Clear cache more aggressively
	cacheDir: 'node_modules/.vite',
});
