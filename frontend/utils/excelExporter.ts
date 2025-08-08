

import type { AnalysisItem } from '../types';

declare var XLSX: any;

export const exportToExcel = (data: AnalysisItem[], fileName: string, includeBasis: boolean): void => {
  // Conditionally map data to include/exclude the '根拠' column.
  // The order of properties is important for the sheet header order.
  const formattedData = data.map(item => {
    if (includeBasis) {
      return {
        'スライド番号': item.slideNumber,
        'カテゴリ': item.category,
        '根拠': item.basis,
        '指摘事項': item.issue,
        '改善案': item.suggestion,
        '修正の種類': item.correctionType,
      };
    }
    return {
      'スライド番号': item.slideNumber,
      'カテゴリ': item.category,
      '指摘事項': item.issue,
      '改善案': item.suggestion,
      '修正の種類': item.correctionType,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'AnalysisResults');

  // Conditionally set column widths
  if (includeBasis) {
      worksheet['!cols'] = [
        { wch: 10 }, // スライド番号
        { wch: 15 }, // カテゴリ
        { wch: 30 }, // 根拠
        { wch: 50 }, // 指摘事項
        { wch: 50 }, // 改善案
        { wch: 15 }, // 修正の種類
      ];
  } else {
      worksheet['!cols'] = [
        { wch: 10 }, // スライド番号
        { wch: 15 }, // カテゴリ
        { wch: 50 }, // 指摘事項
        { wch: 50 }, // 改善案
        { wch: 15 }, // 修正の種類
      ];
  }


  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};