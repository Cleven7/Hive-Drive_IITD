import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { createFileItem, saveFileMetadata } from '../utils/hiveUtils';

interface CreateFolderButtonProps {
  currentFolderId: string | null;
  onFolderCreated: () => void;
}

const CreateFolderButton: React.FC<CreateFolderButtonProps> = ({ currentFolderId, onFolderCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showBlockchainOption, setShowBlockchainOption] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFolderName('');
    setPassword('');
    setShowBlockchainOption(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFolderName('');
    setPassword('');
  };
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      alert('Please enter a folder name');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create folder item
      const folderItem = createFileItem(folderName.trim(), 'folder', currentFolderId);
      
      if (showBlockchainOption && password) {
        // Save folder metadata to the blockchain with password
        await saveFileMetadata(folderItem, password);
      } else {
        // Save folder metadata locally only
        await saveFileMetadata(folderItem);
      }
      
      // Close modal and reset state
      handleCloseModal();
      
      // Notify parent component
      onFolderCreated();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <FolderPlus size={18} className="mr-2" />
        New Folder
      </button>
      
      {isModalOpen && (
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
                    <FolderPlus size={24} className="text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Folder</h3>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Folder name"
                        className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        autoFocus
                      />
                      
                      <div className="flex items-center mt-4">
                        <input
                          id="blockchain-option"
                          type="checkbox"
                          checked={showBlockchainOption}
                          onChange={() => setShowBlockchainOption(!showBlockchainOption)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="blockchain-option" className="block ml-2 text-sm text-gray-900">
                          Save to blockchain (permanent storage)
                        </label>
                      </div>
                      
                      {showBlockchainOption && (
                        <div className="mt-3">
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password or Posting Key
                          </label>
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password or posting key"
                            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={isCreating || !folderName.trim() || (showBlockchainOption && !password)}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFolderButton;