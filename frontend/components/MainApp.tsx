// src/components/MainApp.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
    deleteFile as apiDeleteFile,
    startAnalysis as apiStartAnalysis,
    fetchFiles,
    fetchLatestAnalysisItems,
} from '../services/fileService';
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
        loadFiles(); // 初回にサーバから全件
    }, [loadFiles]);

    const handleAddFilesClick = useCallback(() => setView('fileUpload'), []);

    const handleUpload = useCallback(async () => {
        // アップロード画面から戻ったらサーバ同期
        setView('fileManagement');
        await loadFiles();
    }, [loadFiles]);

    // 「結果を見る」を押した時：最新の分析itemsをサーバから取得して該当ファイルにセット
    const handleSelectFile = useCallback(async (id: string) => {
        try {
            const items = await fetchLatestAnalysisItems(id);
            setFiles(prev =>
                prev.map(f => (f.id === id ? { ...f, analysisResult: items, status: 'success' } : f)),
            );
            setSelectedFileId(id);
            setView('analysis');
        } catch (e) {
            console.error(e);
            alert('分析結果の取得に失敗しました');
        }
    }, []);

    const handleDeleteFile = useCallback(
        async (id: string) => {
            if (window.confirm('このファイルを削除しますか？分析結果も失われます。')) {
                await apiDeleteFile(id);
                await loadFiles();
                if (selectedFileId === id) {
                    setSelectedFileId(null);
                    setView('fileManagement');
                }
            }
        },
        [loadFiles, selectedFileId],
    );

    // 解析実行（サーバに任せる）
    const startAnalysisProcess = useCallback(
        async (fileId: string) => {
            setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'parsing', error: null } : f)));
            try {
                await apiStartAnalysis(fileId);
                await loadFiles(); // ステータス反映
            } catch (e) {
                console.error(e);
                setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'error', error: '分析に失敗しました' } : f)));
            }
        },
        [loadFiles],
    );

    const handleBack = useCallback(() => {
        setSelectedFileId(null);
        setView('fileManagement');
    }, []);

    const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) ?? null : null;

    return (
        <div className="flex flex-col min-h-screen">
            <Header onLogout={onLogout} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {view === 'fileManagement' && (
                        <FileManagementScreen
                            files={files}
                            onAddFilesClick={handleAddFilesClick}
                            onSelectFile={handleSelectFile}
                            onDeleteFile={handleDeleteFile}
                            onStartAnalysis={startAnalysisProcess}
                        />
                    )}

                    {view === 'fileUpload' && (
                        <FileUploadScreen onUpload={handleUpload} onCancel={() => setView('fileManagement')} />
                    )}

                    {view === 'analysis' && selectedFile && (
                        <AnalysisScreen
                            fileData={selectedFile}
                            onUpdateFile={(id, updates) =>
                                setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)))
                            }
                            onBack={handleBack}
                            onTriggerAnalysis={startAnalysisProcess}
                        />
                    )}

                    {view === 'analysis' && !selectedFile && (
                        <div>
                            <p>ファイルが見つかりません。ファイル管理画面に戻ります。</p>
                            <button onClick={handleBack}>戻る</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MainApp;
