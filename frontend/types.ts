// src/types.ts

export type FileStatus = 'pending' | 'parsing' | 'analyzing' | 'success' | 'error';
export type AugmentationStatus = 'idle' | 'augmenting' | 'success' | 'error';

/** サーバーが返す item（id は number） */
export interface ServerAnalysisItem {
  id: number;
  slideNumber: number;
  category: string;
  basis: string;
  issue: string;
  suggestion: string;
}

/** フロントで使う item（id は string。なくてもUUIDを振る） */
export interface AnalysisItem {
  id: string;
  slideNumber: number;
  category: string;
  basis: string;
  issue: string;
  suggestion: string;
  correctionType?: '必須' | '任意';
}

export interface ManagedFile {
  id: string;            // サーバは数値だがフロントでは文字列として扱う
  file?: File;           // 一覧取得時は undefined、アップロード直後は File
  name: string;
  size: number;
  uploadDate: string;
  status: FileStatus;
  analysisResult: AnalysisItem[];
  error: string | null;
  isBasisAugmented: boolean;
  augmentationStatus: AugmentationStatus;
}

/** GET /files/{file_id}/analyses */
export interface AnalysisSummary {
  id: number;
  created_at: string;
  model: string;
  status: string;
  items_count: number;
}

/** GET /analyses/{analysis_id} */
export interface AnalysisDetail {
  id: number;
  file_id: number;
  created_at: string;
  model: string;
  status: string;
  rules_version: string | null;
  result_json: ServerAnalysisItem[] | null;
  items: ServerAnalysisItem[];         // サーバ形式の配列
}
