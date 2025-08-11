// src/components/Dashboard.tsx
import React, { useCallback, useEffect, useState } from 'react';
import type { AnalysisItem, ManagedFile } from '../types';
import { exportToExcel } from '../utils/excelExporter';
import AnalysisTable from './AnalysisTable';
import EditAnalysisModal from './EditAnalysisModal';
import Spinner from './Spinner';
import UndoToast from './UndoToast';
import { AlertTriangleIcon, CheckCircleIcon, ChevronLeftIcon, FileIcon } from './icons';

interface AnalysisScreenProps {
  fileData: ManagedFile;
  onUpdateFile: (id: string, updates: Partial<ManagedFile>) => void;
  onBack: () => void;
  onTriggerAnalysis: (id: string) => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ fileData, onUpdateFile, onBack, onTriggerAnalysis }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [undoCache, setUndoCache] = useState<{ previousState: AnalysisItem[]; timerId: number | null } | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (undoCache?.timerId) clearTimeout(undoCache.timerId);
    };
  }, [undoCache]);

  const handleStartAnalysis = useCallback(() => {
    if (fileData.status === 'analyzing' || fileData.status === 'parsing') return;
    onTriggerAnalysis(fileData.id);
    onBack();
  }, [fileData.id, fileData.status, onTriggerAnalysis, onBack]);

  const handleDownload = useCallback(() => {
    if (fileData.analysisResult.length > 0) {
      const fileName = fileData.name.replace(/\.pptx$/, '');
      exportToExcel(fileData.analysisResult, `${fileName}-analysis`, fileData.isBasisAugmented);
    }
  }, [fileData]);

  const handleRowClick = useCallback(
    async (index: number) => {
      const item = fileData.analysisResult[index];
      if (item) {
        setEditingItemId(item.id);
        setIsModalOpen(true);
      }
    },
    [fileData.analysisResult],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItemId(null);
  }, []);

  const handleSaveModal = useCallback(
    (updatedItem: AnalysisItem) => {
      if (!updatedItem.id) return;
      const newResults = fileData.analysisResult.map(item => (item.id === updatedItem.id ? updatedItem : item));
      newResults.sort((a, b) => a.slideNumber - b.slideNumber);
      onUpdateFile(fileData.id, { analysisResult: newResults });
    },
    [fileData.id, fileData.analysisResult, onUpdateFile],
  );

  const handleNavigateModal = useCallback(
    (direction: 'prev' | 'next') => {
      if (editingItemId === null) return;
      const currentIndex = fileData.analysisResult.findIndex(item => item.id === editingItemId);
      if (currentIndex === -1) return;
      const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < fileData.analysisResult.length) {
        const newItem = fileData.analysisResult[newIndex];
        setEditingItemId(newItem.id);
      }
    },
    [editingItemId, fileData.analysisResult],
  );

  const handleAddItem = useCallback(() => {
    const newItem: AnalysisItem = {
      id: crypto.randomUUID(),
      slideNumber: 1,
      category: '表現',
      basis: '',
      issue: '',
      suggestion: '',
      correctionType: '任意',
    };
    const newResults = [...fileData.analysisResult, newItem];
    onUpdateFile(fileData.id, { analysisResult: newResults });
    setEditingItemId(newItem.id);
    setIsModalOpen(true);
  }, [fileData.id, fileData.analysisResult, onUpdateFile]);

  const handleUndoDelete = useCallback(() => {
    if (undoCache) {
      if (undoCache.timerId) clearTimeout(undoCache.timerId);
      onUpdateFile(fileData.id, { analysisResult: undoCache.previousState });
      setUndoCache(null);
    }
  }, [undoCache, fileData.id, onUpdateFile]);

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (undoCache?.timerId) clearTimeout(undoCache.timerId);
      const originalState = fileData.analysisResult;
      const newResults = originalState.filter(item => item.id !== itemId);
      onUpdateFile(fileData.id, { analysisResult: newResults });
      if (editingItemId === itemId) handleCloseModal();
      const newTimerId = window.setTimeout(() => setUndoCache(null), 7000);
      setUndoCache({ previousState: originalState, timerId: newTimerId });
    },
    [fileData.id, fileData.analysisResult, editingItemId, onUpdateFile, handleCloseModal, undoCache?.timerId],
  );

  const editingItem = editingItemId ? fileData.analysisResult.find(item => item.id === editingItemId) : null;
  const editingItemIndex = editingItemId ? fileData.analysisResult.findIndex(item => item.id === editingItemId) : -1;

  const renderStatus = () => {
    const hasError = fileData.status === 'error' || fileData.augmentationStatus === 'error';
    if (hasError) {
      return (
        <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertTriangleIcon className="h-6 w-6" />
          <span>{fileData.error}</span>
        </div>
      );
    }

    switch (fileData.status) {
      case 'parsing':
        return <div className="text-center text-slate-600">ファイルを解析中...</div>;
      case 'analyzing':
        return <div className="text-center text-slate-600">AIがスライドを分析中...</div>;
      case 'success':
        if (fileData.analysisResult.length === 0) {
          return (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
              <span>分析完了。指摘事項は見つかりませんでした。</span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircleIcon className="h-6 w-6" />
            {/* <span>一次分析が完了しました。</span> */}
            <span>分析が完了しました。</span>
          </div>
        );
      case 'pending':
        return (
          <div className="text-center">
            <button
              onClick={handleStartAnalysis}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-105 shadow-md"
            >
              分析を開始
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          ファイル一覧に戻る
        </button>
      </div>

      <div className="flex items-center space-x-3 text-slate-700">
        <FileIcon className="h-8 w-8 text-blue-500" />
        <div>
          <p className="font-semibold">{fileData.name}</p>
          <p className="text-sm text-slate-500">{`${(fileData.size / 1024 / 1024).toFixed(2)} MB`}</p>
        </div>
      </div>

      <div className="flex justify-center items-center h-24">
        {(fileData.status === 'parsing' || fileData.status === 'analyzing') ? <Spinner /> : renderStatus()}
      </div>

      {(fileData.status === 'success' || (fileData.status === 'error' && fileData.analysisResult.length > 0)) && (
        <div>
          <AnalysisTable
            data={fileData.analysisResult}
            onDownload={handleDownload}
            isBasisAugmented={fileData.isBasisAugmented}
            isAugmenting={false}
            onAugment={undefined}        // 根拠追加機能は無効化
            onRowClick={handleRowClick}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      )}

      {isModalOpen && editingItem && (
        <EditAnalysisModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          item={editingItem}
          allSlideContents={[]}         // プレビューは行わない
          onSave={handleSaveModal}
          onNavigate={handleNavigateModal}
          canNavigatePrev={editingItemIndex > 0}
          canNavigateNext={editingItemIndex < fileData.analysisResult.length - 1}
          onDelete={() => handleDeleteItem(editingItem.id)}
        />
      )}

      {undoCache && (
        <UndoToast
          message="指摘事項を削除しました。"
          onUndo={handleUndoDelete}
          onDismiss={() => setUndoCache(null)}
        />
      )}
    </div>
  );
};

export default AnalysisScreen;
