#!/usr/bin/env node

/**
 * Upload Next.js static assets to Cloudflare R2
 * Run after: npm run build
 * Usage: tsx upload-to-r2.ts
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { lookup } from 'mime-types';
import dotenv from 'dotenv';

// Load .env from root directory
const rootDir = process.cwd().endsWith('scripts') 
  ? join(process.cwd(), '..') 
  : process.cwd();

dotenv.config({ path: join(rootDir, '.env') });

// ===== CONFIGURATION =====
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_PUBLIC_DOMAIN = process.env.S3_PUBLIC_DOMAIN;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

// Color constants
const RED = `\x1b[0;31m`;
const GREEN = `\x1b[0;32m`;
const BLUE = `\x1B[38;5;74m`;
const CYAN = `\x1b[0;36m`;
const YELLOW = `\x1b[0;33m`;
const BOLD = `\x1B[1m`;
const DIM = `\x1B[2m`;
const RESET = `\x1B[0m`;

const WARNING = `${BOLD}${YELLOW}⚠${RESET}${YELLOW}`;
const ERROR = `${BOLD}${RED}✘${RESET}${RED}`;
const SUCCESS = `${BOLD}${GREEN}✔${RESET}${GREEN}`;
const POINTER = `${BOLD}${BLUE}▍`;
const HEAD = `${BOLD}${BLUE}█████${RESET}${RESET}${BOLD}${CYAN}`;

// ===== TYPES =====
interface UploadResult {
  success: number;
  failed: number;
}

// ===== VALIDATE CONFIGURATION =====
function validateConfig(): void {
  console.log(`${HEAD} Cloudflare R2 Upload Script ${RESET}\n`);

  if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET) {
    console.error(`${ERROR} Missing S3/R2 credentials in environment variables${RESET}`);
    console.error(`${POINTER} Required:${RESET}`);
    console.error(`  ${DIM}- S3_BUCKET${RESET}`);
    console.error(`  ${DIM}- S3_ENDPOINT${RESET}`);
    console.error(`  ${DIM}- S3_ACCESS_KEY_ID${RESET}`);
    console.error(`  ${DIM}- S3_SECRET_ACCESS_KEY${RESET}`);
    console.error(`  ${DIM}- S3_PUBLIC_DOMAIN (optional)${RESET}\n`);
    process.exit(1);
  }

  console.log(`${SUCCESS} Configuration loaded${RESET}`);
  console.log(`${POINTER} Bucket:${RESET}${BLUE} ${S3_BUCKET}${RESET}`);
  console.log(`${POINTER} Endpoint:${RESET}${BLUE} ${S3_ENDPOINT}${RESET}`);
  if (S3_PUBLIC_DOMAIN) {
    console.log(`${POINTER} Public URL:${RESET}${BLUE} ${S3_PUBLIC_DOMAIN}${RESET}`);
  }
  console.log('');
}

// ===== INITIALIZE R2 CLIENT =====
function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: S3_ENDPOINT!,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
  });
}

// ===== FILE UTILITIES =====
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function getContentType(filePath: string): string {
  const mimeType = lookup(filePath);
  if (mimeType) return mimeType;

  // Fallback for common Next.js files
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.map')) return 'application/json';
  
  return 'application/octet-stream';
}

function getCacheControl(filePath: string): string {
  // Next.js static files have content hashes, so they can be cached forever
  if (filePath.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=3600';
}

// ===== UPLOAD FUNCTIONS =====
async function uploadFile(
  client: S3Client,
  localPath: string,
  remotePath: string
): Promise<boolean> {
  try {
    const fileContent = readFileSync(localPath);
    const contentType = getContentType(localPath);
    const cacheControl = getCacheControl(remotePath);

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET!,
      Key: remotePath,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error(`${ERROR} Failed to upload ${remotePath}${RESET}`);
    if (error instanceof Error) {
      console.error(`${DIM}${error.message}${RESET}`);
    }
    return false;
  }
}

async function uploadDirectory(
  client: S3Client,
  localDir: string,
  remotePrefix: string = ''
): Promise<UploadResult> {
  console.log(`${POINTER} Scanning directory:${RESET}${BLUE} ${localDir}${RESET}\n`);

  const files = getAllFiles(localDir);
  
  if (files.length === 0) {
    console.log(`${WARNING} No files found in ${localDir}${RESET}\n`);
    return { success: 0, failed: 0 };
  }

  console.log(`${POINTER} Found:${RESET}${BLUE} ${files.length} files${RESET}`);
  console.log(`${POINTER} Starting upload...${RESET}\n`);

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const localPath = files[i];
    const relativePath = relative(localDir, localPath);
    const remotePath = remotePrefix ? `${remotePrefix}/${relativePath}` : relativePath;

    // Replace backslashes with forward slashes for Windows compatibility
    const normalizedRemotePath = remotePath.replace(/\\/g, '/');

    process.stdout.write(`${DIM}[${i + 1}/${files.length}]${RESET} ${normalizedRemotePath}...`);

    const success = await uploadFile(client, localPath, normalizedRemotePath);
    
    if (success) {
      console.log(` ${SUCCESS}${RESET}`);
      successCount++;
    } else {
      console.log(` ${ERROR}${RESET}`);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}

// ===== MAIN =====
async function main(): Promise<void> {
  validateConfig();
  
  const staticDir = join(rootDir, '.next', 'static');
  
  // Check if build exists
  try {
    statSync(staticDir);
  } catch (error) {
    console.error(`${ERROR} .next/static directory not found${RESET}`);
    console.error(`${POINTER} Run this command first:${RESET}${BLUE} npm run build${RESET}\n`);
    process.exit(1);
  }

  const client = createR2Client();
  const startTime = Date.now();

  const { success, failed } = await uploadDirectory(
    client,
    staticDir,
    '_next/static'
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${HEAD} Upload Complete ${RESET}\n`);
  console.log(`${SUCCESS} Uploaded: ${success} files${RESET}`);
  
  if (failed > 0) {
    console.log(`${ERROR} Failed: ${failed} files${RESET}`);
  }
  
  console.log(`${POINTER} Duration:${RESET}${BLUE} ${duration}s${RESET}`);
  
  if (S3_PUBLIC_DOMAIN) {
    console.log(`${POINTER} Assets URL:${RESET}${BLUE} ${S3_PUBLIC_DOMAIN}/_next/static/${RESET}`);
  }
  
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n${ERROR} Upload failed${RESET}`);
  if (error instanceof Error) {
    console.error(`${DIM}${error.message}${RESET}\n`);
  }
  process.exit(1);
});