// src/services/fileService.ts
import { AnalysisDetail, AnalysisItem, AnalysisSummary, ManagedFile } from '../types';

const API_BASE = 'http://127.0.0.1:8000';

export async function fetchFiles(): Promise<ManagedFile[]> {
    const res = await fetch(`${API_BASE}/files`);
    if (!res.ok) throw new Error('ファイル一覧の取得に失敗しました');
    const list = await res.json();
    return list.map((f: any) => ({
        ...f,
        file: undefined,
    })) as ManagedFile[];
}

export async function uploadFiles(files: File[]): Promise<ManagedFile[]> {
    const uploaded: ManagedFile[] = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/files`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`ファイル「${file.name}」のアップロードに失敗しました`);

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

export async function startAnalysis(id: string): Promise<number | void> {
    const formData = new FormData();
    formData.append('file_id', id);
    const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('分析開始に失敗しました');
    const analysisId = res.headers.get('X-Analysis-Id');
    return analysisId ? Number(analysisId) : undefined;
}

export async function fetchAnalysesByFile(fileId: string): Promise<AnalysisSummary[]> {
    const res = await fetch(`${API_BASE}/files/${fileId}/analyses`);
    if (!res.ok) throw new Error('分析一覧の取得に失敗しました');
    return res.json();
}

export async function getAnalysis(analysisId: number): Promise<AnalysisDetail> {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}`);
    if (!res.ok) throw new Error('分析詳細の取得に失敗しました');
    return res.json();
}

/** 最新の分析 items を取得してフロント用( id: string )に整形 */
export async function fetchLatestAnalysisItems(fileId: string): Promise<AnalysisItem[]> {
    const summaries = await fetchAnalysesByFile(fileId);
    if (!summaries || summaries.length === 0) return [];

    const latest = summaries[0];
    const detail = await getAnalysis(latest.id);
    const items = detail.items ?? [];

    return items.map((i) => ({
        id: String(i.id ?? crypto.randomUUID()),
        slideNumber: i.slideNumber,
        category: i.category,
        basis: i.basis,
        issue: i.issue,
        suggestion: i.suggestion,
        correctionType: '任意',
    }));
}

/** 最新分析に item を追加（サーバ作成→返却） */
export async function createAnalysisItemForLatest(
    fileId: string,
    payload: Omit<AnalysisItem, 'id' | 'correctionType'>,
): Promise<AnalysisItem> {
    const res = await fetch(`${API_BASE}/files/${fileId}/analyses/latest/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            slideNumber: payload.slideNumber,
            category: payload.category,
            basis: payload.basis,
            issue: payload.issue,
            suggestion: payload.suggestion,
        }),
    });
    if (!res.ok) throw new Error('指摘事項の追加に失敗しました');
    const data = await res.json();
    return {
        id: String(data.id),
        slideNumber: data.slideNumber,
        category: data.category,
        basis: data.basis,
        issue: data.issue,
        suggestion: data.suggestion,
        correctionType: '任意',
    };
}

/** item を更新 */
export async function updateAnalysisItem(item: AnalysisItem): Promise<AnalysisItem> {
    const res = await fetch(`${API_BASE}/analysis-items/${Number(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            slideNumber: item.slideNumber,
            category: item.category,
            basis: item.basis,
            issue: item.issue,
            suggestion: item.suggestion,
        }),
    });
    if (!res.ok) throw new Error('指摘事項の更新に失敗しました');
    const data = await res.json();
    return {
        id: String(data.id),
        slideNumber: data.slideNumber,
        category: data.category,
        basis: data.basis,
        issue: data.issue,
        suggestion: data.suggestion,
        correctionType: item.correctionType ?? '任意',
    };
}

/** item を削除 */
export async function deleteAnalysisItem(itemId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/analysis-items/${Number(itemId)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('指摘事項の削除に失敗しました');
}
