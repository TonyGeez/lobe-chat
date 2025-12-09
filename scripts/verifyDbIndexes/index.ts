#!/usr/bin/env node

/**
 * Verify Performance Indexes Installation
 * Checks if all performance optimization indexes were successfully created
 * 
 * Usage: npm run db:verify-indexes
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

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

dotenv.config();

// Expected indexes from the performance optimization migration
const EXPECTED_INDEXES = [
  'messages_topic_id_created_at_idx',
  'messages_user_id_created_at_idx',
  'messages_session_id_created_at_idx',
  'messages_user_id_role_idx',
  'messages_thread_id_created_at_idx',
  'files_user_id_idx',
  'files_user_id_file_type_idx',
  'files_user_id_created_at_idx',
  'documents_user_id_idx',
  'documents_user_id_file_type_idx',
  'documents_user_id_created_at_idx',
  'messages_files_file_id_idx',
  'messages_files_message_id_idx',
  'topic_documents_document_id_idx',
  'topic_documents_topic_id_idx',
  'knowledge_base_files_file_id_idx',
  'knowledge_base_files_knowledge_base_id_idx',
  'file_chunks_chunk_id_idx',
  'sessions_user_id_pinned_idx',
  'sessions_user_id_type_idx',
  'topics_user_id_favorite_idx',
  'topics_session_id_updated_at_idx',
  'agents_user_id_title_trgm_idx',
  'agents_user_id_virtual_idx',
  'chunks_user_id_type_idx',
  'chunks_user_id_created_at_idx',
  'unstructured_chunks_file_id_idx',
  'unstructured_chunks_composite_id_idx',
  'global_files_creator_idx',
  'global_files_creator_accessed_at_idx',
  'knowledge_bases_user_id_is_public_idx',
  'knowledge_bases_user_id_type_idx',
  'message_queries_message_id_idx',
  'message_queries_embeddings_id_idx',
  'async_tasks_user_id_status_idx',
  'async_tasks_user_id_type_status_idx',
  'threads_topic_id_last_active_at_idx',
  'threads_user_id_status_idx',
  'generations_user_id_created_at_idx',
  'generations_batch_id_idx',
  'generation_batches_topic_id_idx',
  'auth_sessions_user_id_expires_at_idx',
  'accounts_user_id_provider_id_idx',
];

async function getDatabaseUrl(): Promise<string> {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!dbUrl) {
    console.error(`${ERROR} DATABASE_URL or POSTGRES_URL not found in environment${RESET}`);
    console.error(`${POINTER} Please set one of these variables in your .env file${RESET}\n`);
    process.exit(1);
  }
  
  return dbUrl;
}

async function checkIndexExists(pool: Pool, indexName: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE indexname = $1`,
      [indexName]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

async function getIndexSize(pool: Pool, indexName: string): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT pg_size_pretty(pg_relation_size($1::regclass)) as size`,
      [indexName]
    );
    return result.rows[0]?.size || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

async function getTableIndexCount(pool: Pool, tableName: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM pg_indexes WHERE tablename = $1`,
      [tableName]
    );
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    return 0;
  }
}

async function main() {
  console.log(`${HEAD} Verify Performance Indexes ${RESET}\n`);
  
  const dbUrl = await getDatabaseUrl();
  console.log(`${SUCCESS} Database connection configured${RESET}\n`);
  
  const pool = new Pool({
    connectionString: dbUrl,
  });
  
  try {
    await pool.query('SELECT NOW()');
    console.log(`${SUCCESS} Connected to database${RESET}\n`);
    
    console.log(`${POINTER} Checking ${EXPECTED_INDEXES.length} indexes...${RESET}\n`);
    
    let foundCount = 0;
    let missingCount = 0;
    let totalSize = 0;
    
    const missingIndexes: string[] = [];
    
    for (const indexName of EXPECTED_INDEXES) {
      const exists = await checkIndexExists(pool, indexName);
      
      if (exists) {
        const size = await getIndexSize(pool, indexName);
        console.log(`${SUCCESS} ${indexName}${RESET} ${DIM}(${size})${RESET}`);
        foundCount++;
      } else {
        console.log(`${ERROR} ${indexName}${RESET} ${DIM}(missing)${RESET}`);
        missingCount++;
        missingIndexes.push(indexName);
      }
    }
    
    console.log(`\n${HEAD} Summary ${RESET}\n`);
    console.log(`${SUCCESS} Found: ${foundCount}/${EXPECTED_INDEXES.length} indexes${RESET}`);
    
    if (missingCount > 0) {
      console.log(`${ERROR} Missing: ${missingCount} indexes${RESET}\n`);
      console.log(`${HEAD} Missing Indexes ${RESET}\n`);
      missingIndexes.forEach(idx => console.log(`  ${DIM}- ${idx}${RESET}`));
      console.log('');
    }
    
    // Show index counts per table
    console.log(`${HEAD} Index Count by Table ${RESET}\n`);
    const tables = ['messages', 'files', 'documents', 'sessions', 'topics', 'agents', 'chunks'];
    
    for (const table of tables) {
      const count = await getTableIndexCount(pool, table);
      console.log(`${POINTER} ${table}:${RESET}${BLUE} ${count} indexes${RESET}`);
    }
    
    console.log('');
    
    if (missingCount === 0) {
      console.log(`${SUCCESS} All performance indexes are installed!${RESET}\n`);
      process.exit(0);
    } else {
      console.log(`${WARNING} Some indexes are missing. Run the migration again:${RESET}`);
      console.log(`${POINTER} Command:${RESET}${BLUE} npx drizzle-kit push${RESET}\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n${ERROR} Verification failed${RESET}`);
    console.error(`${DIM}${error instanceof Error ? error.message : String(error)}${RESET}\n`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();