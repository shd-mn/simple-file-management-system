'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileList } from '../components/FileList';

interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  path: string;
}

export default function LocalFiles() {
  const [directoryPath, setDirectoryPath] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [sortBy, setSortBy] = useState<keyof FileInfo>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!directoryPath) return;

    try {
      setError(null);
      const params = new URLSearchParams({
        path: directoryPath,
      });
      const response = await fetch(`http://localhost:5000/api/local-files?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      setError(error.message || 'Failed to fetch files');
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      setError(null);
      const filePath = files.find(f => f.name === filename)?.path;
      if (!filePath) {
        throw new Error('File not found');
      }

      const params = new URLSearchParams({
        path: filePath,
      });
      const response = await fetch(`http://localhost:5000/api/local-files?${params}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }
      fetchFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setError(error.message || 'Failed to delete file');
    }
  };

  const handleRename = async (oldName: string, newName: string) => {
    try {
      setError(null);
      const oldPath = files.find(f => f.name === oldName)?.path;
      if (!oldPath) {
        throw new Error('File not found');
      }

      const response = await fetch('http://localhost:5000/api/local-files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPath,
          newName,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to rename file');
      }
      fetchFiles();
    } catch (error: any) {
      console.error('Error renaming file:', error);
      setError(error.message || 'Failed to rename file');
    }
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return sortOrder === 'asc'
      ? (aValue < bValue ? -1 : 1)
      : (aValue > bValue ? -1 : 1);
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Local File Manager</h1>
          <Link
            href="/"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Go to Upload Manager
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <label htmlFor="directoryPath" className="block text-sm font-medium text-gray-700 mb-2">
              Directory Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="directoryPath"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                placeholder="Enter directory path (e.g., C:\Users\YourName\Documents)"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={fetchFiles}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Load Files
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <FileList
            files={sortedFiles}
            onDelete={handleDelete}
            onRename={handleRename}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => {
              if (key === sortBy) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(key);
                setSortOrder('asc');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
