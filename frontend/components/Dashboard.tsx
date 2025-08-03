
import React, { useState, useCallback } from 'react';
import Header from './Header';
import FileUpload from './FileUpload';
import AnalysisTable from './AnalysisTable';
import Spinner from './Spinner';
import { AlertTriangleIcon, CheckCircleIcon, FileIcon } from './icons';
import type { AnalysisItem } from '../types';
import { parsePptx } from '../utils/pptxParser';
import { runInitialAnalysis, augmentWithLegalBasis, getInternalRules, getYakukihouSummary } from '../services/geminiService';
import { exportToExcel } from '../utils/excelExporter';

interface DashboardProps {
  onLogout: () => void;
}

type Status = 'idle' | 'parsing' | 'analyzing' | 'success' | 'error';
type AugmentationStatus = 'idle' | 'augmenting' | 'success' | 'error';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isBasisAugmented, setIsBasisAugmented] = useState(false);
  const [augmentationStatus, setAugmentationStatus] = useState<AugmentationStatus>('idle');

  const handleFileProcess = useCallback(async (file: File) => {
    setUploadedFile(file);
    setStatus('parsing');
    setError(null);
    setAnalysisResult([]);
    setIsBasisAugmented(false);
    setAugmentationStatus('idle');

    try {
      const textContent = await parsePptx(file);
      if (!textContent) {
        throw new Error("スライドからテキストを抽出できませんでした。ファイルが破損しているか、テキストが含まれていない可能性があります。");
      }

      setStatus('analyzing');
      const rules = await getInternalRules();
      const result = await runInitialAnalysis(textContent, rules);
      
      setAnalysisResult(result);
      setStatus('success');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました。';
      setError(`分析に失敗しました: ${message}`);
      setStatus('error');
    }
  }, []);

  const handleAugmentBasis = useCallback(async () => {
    if (analysisResult.length === 0) return;
    
    setAugmentationStatus('augmenting');
    setError(null);
    
    try {
      const yakukihouSummary = await getYakukihouSummary();
      const augmentedResult = await augmentWithLegalBasis(analysisResult, yakukihouSummary);
      setAnalysisResult(augmentedResult);
      setIsBasisAugmented(true);
      setAugmentationStatus('success');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました。';
      setError(`根拠の追加に失敗しました: ${message}`);
      setAugmentationStatus('error');
    }
  }, [analysisResult]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setAnalysisResult([]);
    setUploadedFile(null);
    setIsBasisAugmented(false);
    setAugmentationStatus('idle');
  }, []);

  const handleDownload = useCallback(() => {
      if (uploadedFile && analysisResult.length > 0) {
          const fileName = uploadedFile.name.replace(/\.pptx$/, '');
          exportToExcel(analysisResult, `${fileName}-analysis`, isBasisAugmented);
      }
  }, [analysisResult, uploadedFile, isBasisAugmented]);


  const renderStatus = () => {
    const hasError = status === 'error' || augmentationStatus === 'error';

    if (hasError) {
        return (
            <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertTriangleIcon className="h-6 w-6"/>
                <span>{error}</span>
            </div>
        );
    }
    
    switch (status) {
      case 'parsing':
        return <div className="text-center text-slate-600">ファイルを解析中...</div>;
      case 'analyzing':
        return <div className="text-center text-slate-600">AIがスライドを分析中...</div>;
      case 'success':
        if (augmentationStatus === 'success') {
            return <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircleIcon className="h-6 w-6" />
                <span>根拠の追加が完了しました。</span>
            </div>;
        }
        if (analysisResult.length === 0) {
            return <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircleIcon className="h-6 w-6" />
                <span>分析完了。指摘事項は見つかりませんでした。</span>
            </div>;
        }
        return <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircleIcon className="h-6 w-6" />
            <span>一次分析が完了しました。</span>
        </div>;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogout={onLogout} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {status === 'idle' && (
            <FileUpload onFileUpload={handleFileProcess} />
          )}

          {(status !== 'idle') && (
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-slate-700">
                        <FileIcon className="h-8 w-8 text-blue-500" />
                        <div>
                            <p className="font-semibold">{uploadedFile?.name}</p>
                            <p className="text-sm text-slate-500">{uploadedFile && `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        別のファイルを分析
                    </button>
                </div>
              
                <div className="flex justify-center items-center h-24">
                  {(status === 'parsing' || status === 'analyzing') ? <Spinner /> : renderStatus()}
                </div>
              
                {analysisResult.length > 0 && (
                  <div>
                    <AnalysisTable
                        data={analysisResult}
                        onDownload={handleDownload}
                        isBasisAugmented={isBasisAugmented}
                        isAugmenting={augmentationStatus === 'augmenting'}
                        onAugment={handleAugmentBasis}
                    />
                  </div>
                )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
