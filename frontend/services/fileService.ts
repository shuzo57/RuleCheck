// services/fileService.ts
import { ManagedFile } from '../types';

const API_BASE = 'http://127.0.0.1:8000';

export async function fetchFiles(): Promise<ManagedFile[]> {
    const res = await fetch(`${API_BASE}/files`);
    if (!res.ok) throw new Error('ファイル一覧の取得に失敗しました');
    const list = await res.json();
    return list.map((f: any) => ({
        ...f,
        file: undefined, // サーバーからは送られない
    }));
}

export async function uploadFiles(files: File[]): Promise<ManagedFile[]> {
    const uploaded: ManagedFile[] = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/files`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`ファイル「${file.name}」のアップロードに失敗しました`);
        }

        const data = await res.json();
        uploaded.push({
            id: String(data.file_id),
            file,
            name: data.filename || file.name,
            size: data.size_bytes ?? file.size,
            uploadDate: new Date().toISOString(),
            status: 'pending',
            analysisResult: [],
            error: null,
            isBasisAugmented: false,
            augmentationStatus: 'idle',
        });
    }
    return uploaded;
}

export async function deleteFile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/files/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('ファイル削除に失敗しました');
}

export async function startAnalysis(id: string): Promise<void> {
    const formData = new FormData();
    formData.append("file_id", id);
    const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) throw new Error("分析開始に失敗しました");
}
