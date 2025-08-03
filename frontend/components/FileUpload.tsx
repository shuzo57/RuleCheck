
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      if (files[0].type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        onFileUpload(files[0]);
      } else {
        alert('PowerPoint (.pptx) ファイルのみアップロードできます。');
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative block w-full border-2 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 border-dashed'
        } rounded-lg p-12 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300`}
      >
        <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
        <span className="mt-2 block text-sm font-medium text-slate-900">
          ここにファイルをドラッグ＆ドロップ
        </span>
        <span className="text-xs text-slate-500">または</span>
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
        >
          <span> ファイルを選択</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </label>
        <p className="text-xs text-slate-500 mt-1">.pptx ファイルのみ対応</p>
      </div>
    </div>
  );
};

export default FileUpload;
