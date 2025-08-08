
import React, { useState, useCallback } from 'react';
import Header from './Header';
import FileManagementScreen from './FileManagementScreen';
import FileUploadScreen from './FileUpload';
import AnalysisScreen from './Dashboard';
import { ManagedFile } from '../types';
import { parsePptx } from '../utils/pptxParser';
import { getInternalRules, runInitialAnalysis } from '../services/geminiService';

type View = 'fileManagement' | 'fileUpload' | 'analysis';

interface MainAppProps {
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ onLogout }) => {
    const [view, setView] = useState<View>('fileManagement');
    const [files, setFiles] = useState<ManagedFile[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const handleUpdateFile = useCallback((id: string, updates: Partial<ManagedFile>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }, []);

    const startAnalysisProcess = useCallback(async (fileId: string) => {
        const fileToAnalyze = files.find(f => f.id === fileId);
        if (!fileToAnalyze || fileToAnalyze.status === 'analyzing' || fileToAnalyze.status === 'parsing') {
            return;
        }

        handleUpdateFile(fileId, { status: 'parsing', error: null, analysisResult: [], isBasisAugmented: false, augmentationStatus: 'idle' });

        try {
            const textContent = await parsePptx(fileToAnalyze.file);
            if (!textContent) {
                throw new Error("スライドからテキストを抽出できませんでした。");
            }

            handleUpdateFile(fileId, { status: 'analyzing' });
            const rules = await getInternalRules();
            const result = await runInitialAnalysis(textContent, rules);
            
            handleUpdateFile(fileId, { analysisResult: result, status: 'success' });
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : '不明なエラーが発生しました。';
            handleUpdateFile(fileId, { status: 'error', error: `分析に失敗しました: ${message}` });
        }
    }, [files, handleUpdateFile]);


    const handleAddFilesClick = useCallback(() => {
        setView('fileUpload');
    }, []);

    const handleUpload = useCallback((uploadedFiles: File[]) => {
        const newManagedFiles: ManagedFile[] = uploadedFiles.map(file => ({
            id: crypto.randomUUID(),
            file: file,
            name: file.name,
            size: file.size,
            uploadDate: new Date().toISOString(),
            status: 'pending',
            analysisResult: [],
            error: null,
            isBasisAugmented: false,
            augmentationStatus: 'idle',
        }));
        setFiles(prev => [...prev, ...newManagedFiles]);
        setView('fileManagement');
    }, []);

    const handleSelectFile = useCallback((id: string) => {
        setSelectedFileId(id);
        setView('analysis');
    }, []);

    const handleDeleteFile = useCallback((id: string) => {
        if (window.confirm("このファイルを削除しますか？分析結果も失われます。")) {
            setFiles(prev => prev.filter(f => f.id !== id));
        }
    }, []);
    
    const handleBack = useCallback(() => {
        setSelectedFileId(null);
        setView('fileManagement');
    }, []);

    const selectedFile = files.find(f => f.id === selectedFileId);

    const renderContent = () => {
        switch(view) {
            case 'fileManagement':
                return (
                    <FileManagementScreen
                        files={files}
                        onAddFilesClick={handleAddFilesClick}
                        onSelectFile={handleSelectFile}
                        onDeleteFile={handleDeleteFile}
                        onStartAnalysis={startAnalysisProcess}
                    />
                );
            case 'fileUpload':
                return <FileUploadScreen onUpload={handleUpload} onCancel={() => setView('fileManagement')} />;
            case 'analysis':
                return selectedFile ? (
                    <AnalysisScreen 
                        fileData={selectedFile}
                        onUpdateFile={handleUpdateFile}
                        onBack={handleBack}
                        onTriggerAnalysis={startAnalysisProcess}
                    />
                ) : (
                    <div>
                        <p>ファイルが見つかりません。ファイル管理画面に戻ります。</p>
                        <button onClick={handleBack}>戻る</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header onLogout={onLogout} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default MainApp;
