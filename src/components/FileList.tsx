import React from 'react';
import { format } from 'date-fns';
import { File, Folder, MoreVertical, Star, Download, Trash2, Share2, Info } from 'lucide-react';
import { FileItem } from '../types';
import { toggleStarFile, deleteFile, downloadFile } from '../utils/hiveUtils';

interface FileListProps {
  files: FileItem[];
  onRefresh: () => void;
}

const FileList: React.FC<FileListProps> = ({ files, onRefresh }) => {
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  
  const handleToggleStar = async (fileId: string) => {
    await toggleStarFile(fileId);
    onRefresh();
    setActiveDropdown(null);
  };
  
  const handleDelete = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteFile(fileId);
      onRefresh();
      setActiveDropdown(null);
    }
  };
  
  const handleDownload = (fileId: string) => {
    downloadFile(fileId);
    setActiveDropdown(null);
  };
  
  const toggleDropdown = (fileId: string) => {
    setActiveDropdown(activeDropdown === fileId ? null : fileId);
  };
  
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Folder size={48} className="text-gray-300" />
        <p className="mt-4 text-gray-500">No files in this location</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Owner
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Modified
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Size
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                    {file.type === 'folder' ? (
                      <Folder size={24} className="text-blue-500" />
                    ) : (
                      <File size={24} className="text-gray-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-500">{file.type}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{file.owner}</div>
                {file.shared && (
                  <div className="text-xs text-blue-500 flex items-center mt-1">
                    <Share2 size={12} className="mr-1" />
                    Shared
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {format(new Date(file.modifiedAt), 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(file.modifiedAt), 'h:mm a')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {file.type === 'file' ? `${Math.round(file.size! / 1024)} KB` : '--'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(file.id)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeDropdown === file.id && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          onClick={() => handleToggleStar(file.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Star size={16} className={file.starred ? "text-yellow-400 mr-2" : "mr-2"} />
                          {file.starred ? 'Unstar' : 'Star'}
                        </button>
                        {file.type === 'file' && (
                          <button 
                            onClick={() => handleDownload(file.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Download size={16} className="mr-2" />
                            Download
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Info size={16} className="mr-2" />
                          Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;