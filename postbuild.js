#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a public directory in dist if it doesn't exist
const distPublicPath = path.join(__dirname, 'dist', 'public');
const serverPublicPath = path.join(__dirname, 'dist', 'server', 'public');

// Ensure the server directory exists
const serverDir = path.join(__dirname, 'dist', 'server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

// Create a symlink from dist/server/public to dist/public
if (fs.existsSync(distPublicPath) && !fs.existsSync(serverPublicPath)) {
  console.log('Creating symlink from dist/server/public to dist/public...');
  fs.symlinkSync('../public', serverPublicPath);
  console.log('Symlink created successfully!');
}

console.log('Post-build script completed.');