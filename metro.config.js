const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ──────────────────────────────────────────────────────────────────────────────
// FIX: Prevent Metro from crawling duplicate/backup directories that cause
//      Haste module collisions → HTTP 500 errors on the development server.
//
// On Windows, Metro paths may use backslashes, so we match both / and \\.
// ──────────────────────────────────────────────────────────────────────────────

config.resolver.blockList = [
  // Backup node_modules (renamed or original)
  /.*[/\\]_node_modules_old_backup[/\\].*/,
  /.*[/\\]node_modules_old[/\\].*/,

  // Scratch folder containing teammate's backup code
  /.*[/\\]scratch[/\\].*/,

  // macOS resource forks from zip extraction
  /.*[/\\]__MACOSX[/\\].*/,

  // dist-check folder
  /.*[/\\]dist-check[/\\].*/,
];

// ──────────────────────────────────────────────────────────────────────────────
// Lock project root to THIS directory only — prevent Metro from crawling
// upward into the parent ROADSoS folder (which has its own package.json
// and node_modules with duplicate packages like @expo, uuid, yaml, etc.)
// ──────────────────────────────────────────────────────────────────────────────
config.projectRoot = __dirname;
config.watchFolders = [];

module.exports = config;
