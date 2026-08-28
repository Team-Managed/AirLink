// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo, including the pnpm virtual store
//    so Metro can follow symlinks from apps/mobile/node_modules → .pnpm/**
config.watchFolders = [monorepoRoot, path.resolve(monorepoRoot, "node_modules/.pnpm")];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
