
export interface AnalysisItem {
  id: string; // unique ID for each item
  slideNumber: number;
  category: string;
  basis: string;
  issue: string;
  suggestion: string;
  correctionType: '必須' | '任意';
}

export interface ManagedFile {
  id: string; // unique ID
  file: File;
  name: string;
  size: number;
  uploadDate: string; // ISO string
  status: 'pending' | 'parsing' | 'analyzing' | 'success' | 'error';
  analysisResult: AnalysisItem[];
  error: string | null;
  isBasisAugmented: boolean;
  augmentationStatus: 'idle' | 'augmenting' | 'success' | 'error';
}