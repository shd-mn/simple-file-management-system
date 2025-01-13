'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { FileList } from './components/FileList';
import Image from 'next/image';
import Link from 'next/link';

interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  path: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [sortBy, setSortBy] = useState<keyof FileInfo>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder
      });
      const response = await fetch(`http://localhost:5000/api/files?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files. Please try again.');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [searchTerm, sortBy, sortOrder]);

  const handleDelete = async (filename: string) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:5000/api/files/${filename}`, {
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

  const handleRename = async (filename: string, newName: string) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:5000/api/files/${filename}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newFilename: newName }),
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

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">File Upload Manager</h1>
          <Link
            href="/local"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Go to Local Files
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <FileUploader onUploadComplete={fetchFiles} />
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
            files={files}
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
