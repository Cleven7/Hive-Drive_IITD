import { Client, PrivateKey, PublicKey, Authority, cryptoUtils } from '@hiveio/dhive';
import { FileItem, FileMetadata } from '../types';
import CryptoJS from 'crypto-js';

// Initialize the Hive client with multiple API nodes for redundancy
const client = new Client([
  'https://api.hive.blog',
  'https://api.hivekings.com',
  'https://api.openhive.network'
]);

// Custom JSON ID for our app
const CUSTOM_JSON_ID = 'hive-drive';

// Local storage keys
const STORAGE_KEYS = {
  USERNAME: 'hive_username',
  AUTH_KEY: 'hive_auth_key', // Encrypted private key (posting)
  FILES: 'hive_drive_files',
  ALL_FILES: 'hive_drive_all_files'
};

// Encrypt private key with password before storing
const encryptPrivateKey = (privateKey: string, password: string): string => {
  return CryptoJS.AES.encrypt(privateKey, password).toString();
};

// Decrypt private key using password
const decryptPrivateKey = (encryptedKey: string, password: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Login with Hive credentials
export const loginWithHive = async (username: string, password: string): Promise<boolean> => {
  try {
    // Check if the account exists on the blockchain
    const accounts = await client.database.getAccounts([username]);
    if (accounts.length === 0) {
      console.error('Account not found');
      return false;
    }

    const account = accounts[0];
    
    // Generate private key from username and password
    const privateKey = PrivateKey.fromLogin(username, password, 'posting');
    const publicKey = privateKey.createPublic();
    
    // Verify the public key matches one of the account's posting authorities
    const postingAuth = account.posting as Authority;
    const keyAuths = postingAuth.key_auths;
    
    let keyFound = false;
    for (const [pubKey] of keyAuths) {
      if (pubKey === publicKey.toString()) {
        keyFound = true;
        break;
      }
    }
    
    if (!keyFound) {
      console.error('Invalid credentials');
      return false;
    }
    
    // Store encrypted private key and username
    const encryptedKey = encryptPrivateKey(privateKey.toString(), password);
    localStorage.setItem(STORAGE_KEYS.AUTH_KEY, encryptedKey);
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    
    // Initialize files for this user if they don't exist
    const allFiles = getAllFilesFromLocalStorage();
    if (!allFiles[username]) {
      // Try to fetch files from blockchain first
      try {
        const blockchainFiles = await fetchFilesFromBlockchain(username);
        if (blockchainFiles.length > 0) {
          allFiles[username] = blockchainFiles;
        } else {
          allFiles[username] = [];
        }
      } catch (error) {
        console.error('Error fetching files from blockchain:', error);
        allFiles[username] = [];
      }
      saveAllFilesToLocalStorage(allFiles);
    }
    
    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

// Fetch user's files from the blockchain
const fetchFilesFromBlockchain = async (username: string): Promise<FileItem[]> => {
  try {
    // Get custom_json operations for the user related to our app
    const accountHistory = await client.database.call('get_account_history', [username, -1, 100]);
    
    const files: FileItem[] = [];
    const processedIds = new Set<string>();
    
    // Process operations in reverse to get the latest state
    for (let i = accountHistory.length - 1; i >= 0; i--) {
      const [, operation] = accountHistory[i];
      
      if (operation.op[0] === 'custom_json' && operation.op[1].id === CUSTOM_JSON_ID) {
        try {
          const jsonData = JSON.parse(operation.op[1].json);
          
          if (jsonData.app === 'hive_drive') {
            if (jsonData.type === 'file_metadata' && !processedIds.has(jsonData.data.id)) {
              // Add file to the list
              files.push({
                id: jsonData.data.id,
                name: jsonData.data.name,
                type: jsonData.data.type,
                size: jsonData.data.size || 0,
                mimeType: jsonData.data.mimeType || '',
                createdAt: jsonData.data.createdAt || operation.timestamp,
                modifiedAt: jsonData.data.modifiedAt || operation.timestamp,
                parentId: jsonData.data.parentId,
                owner: username,
                starred: false, // Will be updated if we find a star operation
                shared: jsonData.data.shared || false,
                sharedWith: jsonData.data.sharedWith || [],
                content: jsonData.data.content || null
              });
              
              processedIds.add(jsonData.data.id);
            } else if (jsonData.type === 'file_star' && processedIds.has(jsonData.data.id)) {
              // Update star status
              const file = files.find(f => f.id === jsonData.data.id);
              if (file) {
                file.starred = jsonData.data.starred;
              }
            } else if (jsonData.type === 'file_delete' && processedIds.has(jsonData.data.id)) {
              // Remove file from list
              const index = files.findIndex(f => f.id === jsonData.data.id);
              if (index !== -1) {
                files.splice(index, 1);
                processedIds.delete(jsonData.data.id);
              }
            } else if (jsonData.type === 'file_share' && processedIds.has(jsonData.data.id)) {
              // Update shared status
              const file = files.find(f => f.id === jsonData.data.id);
              if (file) {
                file.shared = true;
                file.sharedWith = jsonData.data.sharedWith || [];
              }
            }
          }
        } catch (error) {
          console.error('Error parsing JSON data:', error);
        }
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error fetching files from blockchain:', error);
    return [];
  }
};

// Sign and broadcast a custom_json operation to the blockchain
const broadcastCustomJson = async (
  username: string, 
  jsonId: string, 
  jsonData: any, 
  password: string
): Promise<boolean> => {
  try {
    // Get the encrypted private key
    const encryptedKey = localStorage.getItem(STORAGE_KEYS.AUTH_KEY);
    if (!encryptedKey) {
      throw new Error('Authentication key not found');
    }
    
    // Decrypt the private key
    const privateKeyString = decryptPrivateKey(encryptedKey, password);
    const privateKey = PrivateKey.from(privateKeyString);
    
    // Broadcast the custom_json operation
    const result = await client.broadcast.json({
      id: jsonId,
      json: JSON.stringify(jsonData),
      required_auths: [],
      required_posting_auths: [username]
    }, privateKey);
    
    return true;
  } catch (error) {
    console.error('Error broadcasting to blockchain:', error);
    return false;
  }
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USERNAME);
  localStorage.removeItem(STORAGE_KEYS.AUTH_KEY);
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.USERNAME);
};

// Get all files from local storage (across all users)
export const getAllFilesFromLocalStorage = (): Record<string, FileItem[]> => {
  const filesJson = localStorage.getItem(STORAGE_KEYS.ALL_FILES);
  return filesJson ? JSON.parse(filesJson) : {};
};

// Save all files to local storage
export const saveAllFilesToLocalStorage = (allFiles: Record<string, FileItem[]>): void => {
  localStorage.setItem(STORAGE_KEYS.ALL_FILES, JSON.stringify(allFiles));
};

// Get files for the current user from the all files storage
export const getFilesFromLocalStorage = (): FileItem[] => {
  const username = getCurrentUser();
  if (!username) return [];
  
  const allFiles = getAllFilesFromLocalStorage();
  return allFiles[username] || [];
};

// Save file metadata to Hive blockchain
export const saveFileMetadata = async (file: FileItem, password?: string): Promise<boolean> => {
  try {
    const username = getCurrentUser();
    if (!username) {
      throw new Error('User not logged in');
    }
    
    // Prepare the JSON data to be stored on the blockchain
    const jsonData = {
      type: 'file_metadata',
      app: 'hive_drive',
      data: {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size || 0,
        mimeType: file.mimeType || '',
        parentId: file.parentId,
        createdAt: file.createdAt,
        modifiedAt: file.modifiedAt,
        shared: file.shared,
        sharedWith: file.sharedWith || [],
        // For small text files, we can store content directly
        // For larger files, we would store a reference (e.g., IPFS hash)
        content: file.type === 'file' && file.size && file.size < 8192 ? file.content : null
      }
    };
    
    // If password is provided, broadcast to blockchain
    let blockchainSuccess = false;
    if (password) {
      blockchainSuccess = await broadcastCustomJson(
        username,
        CUSTOM_JSON_ID,
        jsonData,
        password
      );
    }
    
    // Also save to local storage for quick access
    const allFiles = getAllFilesFromLocalStorage();
    
    // Initialize user's files array if it doesn't exist
    if (!allFiles[username]) {
      allFiles[username] = [];
    }
    
    // Update the file in the user's files array
    const userFiles = allFiles[username];
    const fileIndex = userFiles.findIndex(f => f.id === file.id);
    
    if (fileIndex >= 0) {
      userFiles[fileIndex] = file;
    } else {
      userFiles.push(file);
    }
    
    // Save all files back to local storage
    saveAllFilesToLocalStorage(allFiles);
    
    return blockchainSuccess || true;
  } catch (error) {
    console.error('Error saving file metadata:', error);
    return false;
  }
};

// Get files for the current user
export const getUserFiles = (folderId: string | null = null): FileItem[] => {
  const username = getCurrentUser();
  if (!username) {
    return [];
  }
  
  const files = getFilesFromLocalStorage();
  return files.filter(file => 
    file.owner === username && 
    file.parentId === folderId
  );
};

// Generate a unique ID for files
export const generateFileId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create a new file item
export const createFileItem = (
  name: string, 
  type: 'file' | 'folder', 
  parentId: string | null = null,
  fileMetadata?: FileMetadata
): FileItem => {
  const username = getCurrentUser();
  if (!username) {
    throw new Error('User not logged in');
  }
  
  const now = new Date().toISOString();
  
  return {
    id: generateFileId(),
    name,
    type,
    size: fileMetadata?.size || 0,
    mimeType: fileMetadata?.type || '',
    createdAt: now,
    modifiedAt: now,
    parentId,
    owner: username,
    starred: false,
    shared: false,
    content: fileMetadata ? undefined : null, // For folders, content is null
    sharedWith: []
  };
};

// Delete a file
export const deleteFile = async (fileId: string, password?: string): Promise<boolean> => {
  try {
    const username = getCurrentUser();
    if (!username) return false;
    
    // Prepare the JSON data for deletion
    const jsonData = {
      type: 'file_delete',
      app: 'hive_drive',
      data: {
        id: fileId
      }
    };
    
    // If password is provided, broadcast to blockchain
    let blockchainSuccess = false;
    if (password) {
      blockchainSuccess = await broadcastCustomJson(
        username,
        CUSTOM_JSON_ID,
        jsonData,
        password
      );
    }
    
    // Update local storage
    const allFiles = getAllFilesFromLocalStorage();
    if (!allFiles[username]) return false;
    
    allFiles[username] = allFiles[username].filter(file => file.id !== fileId);
    saveAllFilesToLocalStorage(allFiles);
    
    return blockchainSuccess || true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Star/unstar a file
export const toggleStarFile = async (fileId: string, password?: string): Promise<boolean> => {
  try {
    const username = getCurrentUser();
    if (!username) return false;
    
    const allFiles = getAllFilesFromLocalStorage();
    if (!allFiles[username]) return false;
    
    const fileIndex = allFiles[username].findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
      return false;
    }
    
    // Toggle the starred status
    const file = allFiles[username][fileIndex];
    file.starred = !file.starred;
    
    // Prepare the JSON data for starring/unstarring
    const jsonData = {
      type: 'file_star',
      app: 'hive_drive',
      data: {
        id: fileId,
        starred: file.starred
      }
    };
    
    // If password is provided, broadcast to blockchain
    let blockchainSuccess = false;
    if (password) {
      blockchainSuccess = await broadcastCustomJson(
        username,
        CUSTOM_JSON_ID,
        jsonData,
        password
      );
    }
    
    // Update local storage
    allFiles[username][fileIndex] = file;
    saveAllFilesToLocalStorage(allFiles);
    
    return blockchainSuccess || true;
  } catch (error) {
    console.error('Error toggling star:', error);
    return false;
  }
};

// Download a file
export const downloadFile = (fileId: string): boolean => {
  try {
    const username = getCurrentUser();
    if (!username) return false;
    
    const allFiles = getAllFilesFromLocalStorage();
    if (!allFiles[username]) return false;
    
    const file = allFiles[username].find(f => f.id === fileId);
    
    if (!file || file.type === 'folder') {
      return false;
    }
    
    // In a real app, you would:
    // 1. Fetch the file content from IPFS or similar storage using the CID/hash
    // 2. Create a download link for the file
    
    // For demonstration, we'll create a file with the stored content
    let content = file.content || `This is the content of ${file.name}`;
    let mimeType = file.mimeType || 'text/plain';
    
    // Create a blob with the correct MIME type
    const blob = new Blob([content], { type: mimeType });
    
    // Create a download URL
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
};

// Share a file with another user
export const shareFile = async (fileId: string, username: string, password?: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || !username.trim()) {
      return false;
    }
    
    // Check if the target account exists on the blockchain
    const accounts = await client.database.getAccounts([username]);
    if (accounts.length === 0) {
      console.error('Target account not found');
      return false;
    }
    
    const allFiles = getAllFilesFromLocalStorage();
    if (!allFiles[currentUser]) return false;
    
    const fileIndex = allFiles[currentUser].findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
      return false;
    }
    
    // Add user to shared list if not already there
    if (!allFiles[currentUser][fileIndex].sharedWith) {
      allFiles[currentUser][fileIndex].sharedWith = [];
    }
    
    if (!allFiles[currentUser][fileIndex].sharedWith!.includes(username)) {
      allFiles[currentUser][fileIndex].sharedWith!.push(username);
    }
    
    // Mark as shared
    allFiles[currentUser][fileIndex].shared = true;
    
    // Prepare the JSON data for sharing
    const jsonData = {
      type: 'file_share',
      app: 'hive_drive',
      data: {
        id: fileId,
        sharedWith: allFiles[currentUser][fileIndex].sharedWith
      }
    };
    
    // If password is provided, broadcast to blockchain
    let blockchainSuccess = false;
    if (password) {
      blockchainSuccess = await broadcastCustomJson(
        currentUser,
        CUSTOM_JSON_ID,
        jsonData,
        password
      );
    }
    
    // Update local storage
    saveAllFilesToLocalStorage(allFiles);
    
    return blockchainSuccess || true;
  } catch (error) {
    console.error('Error sharing file:', error);
    return false;
  }
};

// Get file by ID
export const getFileById = (fileId: string): FileItem | null => {
  const username = getCurrentUser();
  if (!username) return null;
  
  const allFiles = getAllFilesFromLocalStorage();
  if (!allFiles[username]) return null;
  
  return allFiles[username].find(file => file.id === fileId) || null;
};

// Verify if a user has access to a file
export const verifyFileAccess = (fileId: string, username: string): boolean => {
  const allFiles = getAllFilesFromLocalStorage();
  
  // Check all users' files
  for (const [owner, files] of Object.entries(allFiles)) {
    const file = files.find(f => f.id === fileId);
    
    if (file) {
      // User is the owner
      if (owner === username) {
        return true;
      }
      
      // File is shared with the user
      if (file.shared && file.sharedWith && file.sharedWith.includes(username)) {
        return true;
      }
      
      return false;
    }
  }
  
  return false;
};