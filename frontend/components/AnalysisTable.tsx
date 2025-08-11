// src/components/AnalysisTable.tsx
import React from 'react';
import type { AnalysisItem } from '../types';
import { DownloadIcon, LibraryIcon, PlusCircleIcon, TrashIcon } from './icons';

interface AnalysisTableProps {
  data: AnalysisItem[];
  isBasisAugmented: boolean;

  // Controls for the header bar
  onDownload?: () => void;
  isAugmenting?: boolean;
  onAugment?: () => void;
  onAddItem?: () => void;

  // For interactive editing
  onRowClick?: (index: number) => void;
  onDeleteItem?: (id: string) => void;
}

// ★ correctionType はサーバから来ないことがあるためオプショナルで安全化
const CorrectionTypeBadge: React.FC<{ type?: '必須' | '任意' }> = ({ type = '任意' }) => {
  const isMandatory = type === '必須';
  const colorClasses = isMandatory
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return (
    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-md border ${colorClasses}`}>
      {type}
    </span>
  );
};

const AnalysisTable: React.FC<AnalysisTableProps> = ({
  data, isBasisAugmented,
  onDownload, isAugmenting, onAugment, onAddItem,
  onRowClick, onDeleteItem
}) => {

  const renderControlBar = () => {
    return (
      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={onAddItem}
          disabled={isAugmenting}
          className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          指摘事項を追加
        </button>
        <button
          onClick={onAugment}
          disabled={isBasisAugmented || isAugmenting}
          className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <LibraryIcon className="h-5 w-5 mr-2" />
          {isAugmenting ? '根拠を追加中...' : '根拠の追加'}
        </button>
        <button
          onClick={onDownload}
          disabled={isAugmenting}
          className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 transition-colors shadow-sm"
        >
          <DownloadIcon className="h-5 w-5 mr-2" />
          Excel出力
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-xl font-semibold text-slate-800">分析結果 ({data.length}件)</h2>
        {renderControlBar()}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">スライド番号</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-36">カテゴリ</th>
              {isBasisAugmented && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">根拠</th>
              )}
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">指摘事項</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">改善案</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">修正の種類</th>
              <th className="px-1 py-3 w-16"><span className="sr-only">アクション</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item, index) => (
              <tr
                key={item.id}
                className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                onClick={() => onRowClick?.(index)}
              >
                <td className="px-3 py-2 text-sm text-slate-700 align-top">
                  <p className="py-2 text-center">{item.slideNumber}</p>
                </td>
                <td className="px-3 py-2 text-sm text-slate-700 align-top">
                  <p className="py-2">{item.category}</p>
                </td>
                {isBasisAugmented && (
                  <td className="px-3 py-2 text-sm text-slate-700 align-top">
                    <p className="whitespace-pre-wrap break-words py-2">{item.basis}</p>
                  </td>
                )}
                <td className="px-3 py-2 text-sm text-slate-700 align-top">
                  <p className="whitespace-pre-wrap break-words py-2">{item.issue}</p>
                </td>
                <td className="px-3 py-2 text-sm text-slate-700 align-top">
                  <p className="whitespace-pre-wrap break-words py-2">{item.suggestion}</p>
                </td>
                <td className="px-3 py-2 text-sm text-slate-700 align-top">
                  <div className="py-2">
                    <CorrectionTypeBadge type={item.correctionType} />
                  </div>
                </td>
                <td className="px-1 py-2 text-center align-top">
                  <div className="py-2">
                    {onDeleteItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                        aria-label="削除"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalysisTable;
