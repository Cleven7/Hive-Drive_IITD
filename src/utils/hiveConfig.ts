import { Client } from '@hiveio/dhive';

// Initialize the Hive client with multiple API nodes for redundancy
export const hiveClient = new Client([
  'https://api.hive.blog',
  'https://api.hivekings.com',
  'https://api.openhive.network'
]);

// Custom JSON ID for our app
export const CUSTOM_JSON_ID = 'hive-drive';

// Local storage keys
export const STORAGE_KEYS = {
  USERNAME: 'hive_username',
  AUTH_KEY: 'hive_auth_key', // Encrypted private key (posting)
  FILES: 'hive_drive_files',
  ALL_FILES: 'hive_drive_all_files'
};