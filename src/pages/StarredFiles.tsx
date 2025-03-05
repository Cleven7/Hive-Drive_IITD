import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FileList from '../components/FileList';
import { getFilesFromLocalStorage, getCurrentUser } from '../utils/hiveUtils';
import { FileItem } from '../types';

const StarredFiles: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const username = getCurrentUser();
    if (!username) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Load starred files
  useEffect(() => {
    const loadStarredFiles = () => {
      setIsLoading(true);
      
      try {
        const username = getCurrentUser();
        if (!username) return;
        
        const allFiles = getFilesFromLocalStorage();
        const starredFiles = allFiles.filter(
          file => file.owner === username && file.starred
        );
        
        setFiles(starredFiles);
      } catch (error) {
        console.error('Error loading starred files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStarredFiles();
  }, []);
  
  const handleRefresh = () => {
    const username = getCurrentUser();
    if (!username) return;
    
    const allFiles = getFilesFromLocalStorage();
    const starredFiles = allFiles.filter(
      file => file.owner === username && file.starred
    );
    
    setFiles(starredFiles);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Star size={24} className="text-yellow-400 mr-2" />
              <h1 className="text-2xl font-semibold text-gray-800">Starred Files</h1>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <FileList files={files} onRefresh={handleRefresh} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StarredFiles;