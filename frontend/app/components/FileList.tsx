'use client';

import { useState } from 'react';

interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  path: string;
}

interface FileListProps {
  files: FileInfo[];
  onDelete: (filename: string) => void;
  onRename: (oldName: string, newName: string) => void;
  sortBy: keyof FileInfo;
  sortOrder: 'asc' | 'desc';
  onSort: (key: keyof FileInfo) => void;
}

export function FileList({
  files,
  onDelete,
  onRename,
  sortBy,
  sortOrder,
  onSort,
}: FileListProps) {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRename = (oldName: string) => {
    if (newFileName && newFileName !== oldName) {
      onRename(oldName, newFileName);
    }
    setEditingFile(null);
    setNewFileName('');
  };

  const getSortIcon = (key: keyof FileInfo) => {
    if (sortBy !== key) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getColumnHeader = (key: keyof FileInfo, label: string) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => onSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="text-gray-400">{getSortIcon(key)}</span>
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {getColumnHeader('name', 'Name')}
            {getColumnHeader('size', 'Size')}
            {getColumnHeader('createdAt', 'Created')}
            {getColumnHeader('modifiedAt', 'Modified')}
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.name} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                {editingFile === file.name ? (
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRename(file.name)}
                    className="border rounded px-2 py-1 w-full"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(file.size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.modifiedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingFile === file.name ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleRename(file.name)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingFile(null);
                        setNewFileName('');
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingFile(file.name);
                        setNewFileName(file.name);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this file?')) {
                          onDelete(file.name);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {files.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No files found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
