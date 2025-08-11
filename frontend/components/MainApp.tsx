// src/components/MainApp.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { deleteFile as apiDeleteFile, startAnalysis as apiStartAnalysis, fetchFiles } from '../services/fileService';
import type { ManagedFile } from '../types';
import AnalysisScreen from './Dashboard';
import FileManagementScreen from './FileManagementScreen';
import FileUploadScreen from './FileUpload';
import Header from './Header';

type View = 'fileManagement' | 'fileUpload' | 'analysis';

interface MainAppProps {
    onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ onLogout }) => {
    const [view, setView] = useState<View>('fileManagement');
    const [files, setFiles] = useState<ManagedFile[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        const list = await fetchFiles();
        setFiles(list);
    }, []);

    useEffect(() => {
        // 初回ロード時にサーバーから全件取得（＝過去アップロード済みも含む）
        loadFiles();
    }, [loadFiles]);

    const handleAddFilesClick = useCallback(() => {
        setView('fileUpload');
    }, []);

    const handleUpload = useCallback(async (_uploadedFromClient: ManagedFile[]) => {
        // アップロード後はサーバーから再取得して同期
        setView('fileManagement');
        await loadFiles();
    }, [loadFiles]);

    const handleSelectFile = useCallback((id: string) => {
        setSelectedFileId(id);
        setView('analysis');
    }, []);

    const handleDeleteFile = useCallback(async (id: string) => {
        if (window.confirm('このファイルを削除しますか？分析結果も失われます。')) {
            await apiDeleteFile(id);
            await loadFiles();
        }
    }, [loadFiles]);

    const startAnalysisProcess = useCallback(async (fileId: string) => {
        // 楽観的にUIを更新
        setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'parsing', error: null } : f)));
        try {
            await apiStartAnalysis(fileId);
            // 解析は同期完了なので、再取得すれば "success" になっている（サーバ実装に依存）
            await loadFiles();
        } catch (e) {
            console.error(e);
            setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'error', error: '分析に失敗しました' } : f)));
        }
    }, [loadFiles]);

    const handleBack = useCallback(() => {
        setSelectedFileId(null);
        setView('fileManagement');
    }, []);

    const selectedFile = files.find(f => f.id === selectedFileId) || null;

    const renderContent = () => {
        switch (view) {
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
                        // 画面内更新が必要ならここでfilesを編集する関数を渡す
                        onUpdateFile={(id, updates) => setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)))}
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
                <div className="max-w-7xl mx-auto">{renderContent()}</div>
            </main>
        </div>
    );
};

export default MainApp;
