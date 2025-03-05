import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { createFileItem, saveFileMetadata } from '../utils/hiveUtils';
import { FileMetadata } from '../types';

interface UploadButtonProps {
  currentFolderId: string | null;
  onUploadComplete: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ currentFolderId, onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create file metadata
        const fileMetadata: FileMetadata = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        };
        
        // Create a file item
        const fileItem = createFileItem(file.name, 'file', currentFolderId, fileMetadata);
        
        // In a real app, you would:
        // 1. Upload the file to IPFS or similar decentralized storage
        // 2. Get the CID/hash of the uploaded file
        // 3. Store the CID/hash in the file item
        
        // For demonstration, read the file content
        if (file.size < 1024 * 1024 && (file.type.startsWith('text/') || file.type === 'application/json')) {
          await readFileAsText(file, fileItem);
        } else {
          // For non-text files or large files, create a placeholder
          fileItem.content = `[Binary content of ${file.name}]`;
          fileItem.mimeType = file.type;
          
          // For blockchain integration, we need the password
          setPendingFile(fileItem);
          setShowPasswordModal(true);
          return; // Stop processing more files until this one is handled
        }
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const readFileAsText = (file: File, fileItem: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          if (event.target?.result) {
            // Store the content
            fileItem.content = event.target.result as string;
            fileItem.mimeType = file.type;
            
            // For blockchain integration, we need the password
            setPendingFile(fileItem);
            setShowPasswordModal(true);
            resolve();
          } else {
            reject(new Error('Failed to read file content'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  const handlePasswordSubmit = async () => {
    if (!pendingFile) return;
    
    try {
      // Save file metadata with password for blockchain integration
      await saveFileMetadata(pendingFile, password);
      
      // Reset state
      setPassword('');
      setShowPasswordModal(false);
      setPendingFile(null);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component
      onUploadComplete();
    } catch (error) {
      console.error('Error saving file metadata:', error);
      alert('Failed to save file metadata. Please try again.');
    }
  };
  
  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Upload size={18} className="mr-2" />
        {isUploading ? 'Uploading...' : 'Upload Files'}
      </button>
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-blue-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Confirm Upload to Blockchain</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Enter your password or posting key to save this file to the Hive blockchain.
                      </p>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password or posting key"
                        className="block w-full px-3 py-2 mt-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={!password.trim()}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Upload to Blockchain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    // Save locally only
                    if (pendingFile) {
                      saveFileMetadata(pendingFile);
                      setPendingFile(null);
                      onUploadComplete();
                    }
                  }}
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Locally Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadButton;