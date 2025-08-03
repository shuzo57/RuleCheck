import React from 'react';
import type { AnalysisItem } from '../types';
import { DownloadIcon, LibraryIcon } from './icons';

interface AnalysisTableProps {
  data: AnalysisItem[];
  onDownload: () => void;
  isBasisAugmented: boolean;
  isAugmenting: boolean;
  onAugment: () => void;
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({ data, onDownload, isBasisAugmented, isAugmenting, onAugment }) => {
  return (
    <div className="space-y-4">
        <div className="flex justify-end space-x-3">
            {!isBasisAugmented && (
                <button
                    onClick={onAugment}
                    disabled={isAugmenting}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed"
                >
                    {isAugmenting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            <span>根拠を分析中...</span>
                        </>
                    ) : (
                        <>
                            <LibraryIcon className="h-5 w-5 mr-2" />
                            <span>根拠をAIで追加</span>
                        </>
                    )}
                </button>
            )}
            <button
            onClick={onDownload}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
            <DownloadIcon className="h-5 w-5 mr-2" />
            Excel形式でダウンロード
            </button>
        </div>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-slate-300">
            <thead className="bg-slate-50">
                <tr>
                <th scope="col" className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6 ${isBasisAugmented ? 'w-1/12' : 'w-1/12'}`}>
                    スライド
                </th>
                <th scope="col" className={`px-3 py-3.5 text-left text-sm font-semibold text-slate-900 ${isBasisAugmented ? 'w-2/12' : 'w-2/12'}`}>
                    カテゴリ
                </th>
                 {isBasisAugmented && (
                    <th scope="col" className="w-2/12 px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                        根拠
                    </th>
                 )}
                <th scope="col" className={`px-3 py-3.5 text-left text-sm font-semibold text-slate-900 ${isBasisAugmented ? 'w-3/12' : 'w-4/12'}`}>
                    指摘事項
                </th>
                <th scope="col" className={`px-3 py-3.5 text-left text-sm font-semibold text-slate-900 ${isBasisAugmented ? 'w-4/12' : 'w-5/12'}`}>
                    改善案
                </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
                {data.map((item, index) => (
                <tr key={index}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 text-center">
                    {item.slideNumber}
                    </td>
                    <td className="whitespace-pre-wrap px-3 py-4 text-sm text-slate-600 align-top">{item.category}</td>
                     {isBasisAugmented && (
                        <td className="whitespace-pre-wrap px-3 py-4 text-sm text-slate-600 align-top">{item.basis}</td>
                     )}
                    <td className="whitespace-pre-wrap px-3 py-4 text-sm text-slate-600 align-top">{item.issue}</td>
                    <td className="whitespace-pre-wrap px-3 py-4 text-sm text-slate-600 align-top">{item.suggestion}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    </div>
  );
};

export default AnalysisTable;