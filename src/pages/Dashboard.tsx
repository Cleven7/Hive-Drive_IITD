import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Folder, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FileList from '../components/FileList';
import UploadButton from '../components/UploadButton';
import CreateFolderButton from '../components/CreateFolderButton';
import { getUserFiles, getCurrentUser, getFileById } from '../utils/hiveUtils';
import { FileItem } from '../types';

const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null);
  const [folderPath, setFolderPath] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  
  // Check if user is logged in
  useEffect(() => {
    const username = getCurrentUser();
    if (!username) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Load files for the current folder
  useEffect(() => {
    const loadFiles = () => {
      setIsLoading(true);
      
      try {
        const currentFolderId = folderId || null;
        const filesInFolder = getUserFiles(currentFolderId);
        setFiles(filesInFolder);
        
        // If we're in a subfolder, load the folder path
        if (currentFolderId) {
          // Get the current folder details
          const folder = getFileById(currentFolderId);
          
          if (folder) {
            setCurrentFolder(folder);
            
            // Build folder path (simplified for demo)
            setFolderPath([
              {
                id: 'root',
                name: 'My Drive',
                type: 'folder',
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                parentId: null,
                owner: getCurrentUser() || '',
                starred: false,
                shared: false
              },
              folder
            ]);
          } else {
            // Folder not found, navigate to root
            navigate('/');
          }
        } else {
          setCurrentFolder(null);
          setFolderPath([]);
        }
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFiles();
  }, [folderId, navigate]);
  
  const handleRefresh = () => {
    const currentFolderId = folderId || null;
    const filesInFolder = getUserFiles(currentFolderId);
    setFiles(filesInFolder);
  };
  
  const navigateToFolder = (folder: FileItem) => {
    navigate(`/folder/${folder.id}`);
  };
  
  const navigateToRoot = () => {
    navigate('/');
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center mb-4">
              <button
                onClick={navigateToRoot}
                className="text-sm text-blue-600 hover:underline"
              >
                My Drive
              </button>
              
              {folderPath.length > 1 && (
                <>
                  <ChevronRight size={16} className="mx-1 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {currentFolder?.name || 'Current Folder'}
                  </span>
                </>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center mb-6 space-x-4">
              <UploadButton
                currentFolderId={folderId || null}
                onUploadComplete={handleRefresh}
              />
              <CreateFolderButton
                currentFolderId={folderId || null}
                onFolderCreated={handleRefresh}
              />
            </div>
            
            {/* Files and folders */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <div>
                {/* Folder navigation */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {files.filter(file => file.type === 'folder').map(folder => (
                    <div 
                      key={folder.id}
                      onClick={() => navigateToFolder(folder)}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Folder size={40} className="text-blue-500 mb-2" />
                      <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* File list */}
                <FileList files={files} onRefresh={handleRefresh} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;