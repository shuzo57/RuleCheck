
declare var JSZip: any;

// A helper function to extract text from XML content
const extractTextFromXml = (xmlText: string): string => {
  // This simple regex finds text within <a:t> tags
  const textNodes = xmlText.match(/<a:t>.*?<\/a:t>/g) || [];
  return textNodes.map(node => node.replace(/<a:t>(.*?)<\/a:t>/, '$1')).join(' ');
};

export const parsePptx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target || !event.target.result) {
        return reject(new Error("ファイルの読み込みに失敗しました。"));
      }
      try {
        const zip = await JSZip.loadAsync(event.target.result);
        const slidePromises: Promise<string>[] = [];
        
        // Find all slide XML files
        zip.folder('ppt/slides')?.forEach((relativePath: string, fileEntry: any) => {
          if (relativePath.startsWith('slide') && relativePath.endsWith('.xml')) {
            slidePromises.push(fileEntry.async('string'));
          }
        });
        
        const slideXmls = await Promise.all(slidePromises);
        const allSlidesText = slideXmls
          .map((xml, index) => {
            const slideText = extractTextFromXml(xml).trim();
            return `[スライド ${index + 1}]\n${slideText}`;
          })
          .join('\n\n---SLIDE BREAK---\n\n');
          
        resolve(allSlidesText);
      } catch (e) {
        reject(new Error("PPTXファイルの解析に失敗しました。ファイル形式が正しいか確認してください。"));
      }
    };
    reader.onerror = () => {
      reject(new Error("ファイルの読み込み中にエラーが発生しました。"));
    };
    reader.readAsArrayBuffer(file);
  });
};
