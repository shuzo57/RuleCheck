// src/types.ts

export type FileStatus = 'pending' | 'parsing' | 'analyzing' | 'success' | 'error';
export type AugmentationStatus = 'idle' | 'augmenting' | 'success' | 'error';

export interface AnalysisItem {
  // /analyses/{id} の items[].id は number。result_json 側では無いこともあるためオプショナルに。
  id?: number;
  slideNumber: number;
  category: string;
  basis: string;
  issue: string;
  suggestion: string;

  // フロント専用の補助情報を使う場合はオプショナルで持たせる
  correctionType?: '必須' | '任意';
}

export interface ManagedFile {
  // バックエンドは数値IDだが、フロントでは文字列として扱う前提
  id: string;
  // サーバの /files には file 本体は含まれないためオプショナル
  file?: File;
  name: string;
  size: number;
  uploadDate: string; // ISO string
  status: FileStatus;
  analysisResult: AnalysisItem[];
  error: string | null;
  isBasisAugmented: boolean;
  augmentationStatus: AugmentationStatus;
}

/**
 * GET /files/{file_id}/analyses の1件
 * 例：
 * {
 *   "id": 3,
 *   "created_at": "2025-08-11 10:00:00",
 *   "model": "gemini-2.5-flash",
 *   "status": "succeeded",
 *   "items_count": 12
 * }
 */
export interface AnalysisSummary {
  id: number;
  created_at: string;
  model: string;
  status: string;
  items_count: number;
}

/**
 * GET /analyses/{analysis_id} のレスポンス
 * 例：
 * {
 *   "id": 3,
 *   "file_id": 10,
 *   "created_at": "...",
 *   "model": "gemini-2.5-flash",
 *   "status": "succeeded",
 *   "rules_version": null,
 *   "result_json": [...], // or null
 *   "items": [{ id: 1, slideNumber: 2, ... }, ...]
 * }
 */
export interface AnalysisDetail {
  id: number;
  file_id: number;
  created_at: string;
  model: string;
  status: string;
  rules_version: string | null;
  result_json: AnalysisItem[] | null;
  items: AnalysisItem[];
}
