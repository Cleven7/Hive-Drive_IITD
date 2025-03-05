export interface HiveUser {
  username: string;
  memo_key: string;
  json_metadata: string;
  posting_json_metadata: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt: string;
  modifiedAt: string;
  parentId: string | null;
  owner: string;
  starred: boolean;
  shared: boolean;
  thumbnail?: string;
  content?: string | null; // For storing file content (in a real app, this would be a CID/hash)
  sharedWith?: string[]; // List of usernames the file is shared with
  blockchainTxId?: string; // Transaction ID on the Hive blockchain
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

// Hive blockchain interfaces
export interface HiveOperation {
  type: string;
  value: any;
}

export interface HiveTransaction {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  operations: HiveOperation[];
  extensions: any[];
  signatures: string[];
}

export interface HiveCustomJsonOperation {
  id: string;
  json: string;
  required_auths: string[];
  required_posting_auths: string[];
}

export interface HiveAccountHistoryItem {
  trx_id: string;
  block: number;
  trx_in_block: number;
  op_in_trx: number;
  virtual_op: boolean;
  timestamp: string;
  op: [string, any];
}