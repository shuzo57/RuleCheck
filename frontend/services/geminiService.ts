
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisItem } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY is not defined. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const initialAnalysisSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            slideNumber: {
                type: Type.INTEGER,
                description: "指摘事項が該当するスライドの番号（1始まり）。",
            },
            category: {
                type: Type.STRING,
                description: "指摘事項のカテゴリ（'誤植', '表現', '出典'のいずれか）。",
            },
            basis: {
                type: Type.STRING,
                description: "指摘の根拠となった社内ルール名（例: 'チェック対象ルール 3. 恐怖訴求の禁止'）。薬機法のチェックは後段で行うため、ここでは社内ルールのみを記載する。",
            },
            issue: {
                type: Type.STRING,
                description: "ルールに抵触する可能性のある具体的な指摘事項。",
            },
            suggestion: {
                type: Type.STRING,
                description: "指摘事項に対する具体的な改善案や書き換えの提案。",
            },
        },
        required: ["slideNumber", "category", "basis", "issue", "suggestion"],
    },
};

const legalBasisSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            originalIssue: {
                type: Type.STRING,
                description: "確認対象となった元の指摘事項のテキスト。"
            },
            legalBasis: {
                type: Type.STRING,
                description: "薬機法に抵触する場合、参照資料から該当条文（例: '薬機法 第66条 誇大広告等の禁止'）を引用する。該当しない場合は空文字列を返す。",
            }
        },
        required: ["originalIssue", "legalBasis"],
    }
}

export async function getInternalRules(): Promise<string> {
    try {
        const response = await fetch('assets/rules/internal_rules.txt');
        if (!response.ok) {
            console.error('Failed to fetch internal_rules.txt:', response.statusText);
            return '社内ルールの読み込みに失敗しました。';
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching internal_rules.txt:', error);
        return '社内ルールの読み込み中にエラーが発生しました。';
    }
}

export async function getYakukihouSummary(): Promise<string> {
    try {
        const response = await fetch('assets/rules/yakukihou_summary.txt');
        if (!response.ok) {
            console.error('Failed to fetch yakukihou summary:', response.statusText);
            return '薬機法サマリーの読み込みに失敗しました。';
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching yakukihou summary:', error);
        return '薬機法サマリーの読み込み中にエラーが発生しました。';
    }
}

export async function runInitialAnalysis(text: string, rulesText: string): Promise<AnalysisItem[]> {
    const prompt = `
あなたは、医療・製薬・ヘルスケア業界向けのスライド資料を専門とするコンプライアンスチェック担当者です。
ユーザーが作成したスライド資料のテキスト内容が提供されます。
あなたは、以下に示す「チェック対象ルール」に準拠しているか厳しくチェックし、違反している可能性のある項目を指摘してください。

# チェック対象ルール
${rulesText}

# 指摘のトーン
- 専門家として、丁寧かつ明確な言葉遣いをしてください。
- 指摘事項（issue）と、具体的な改善案（suggestion）を提示してください。
- 指摘の根拠(basis)には、「チェック対象ルール」の項目名を記載してください（例: 'チェック対象ルール 3. 恐怖訴求の禁止'）。
- **薬機法に関する指摘はここでは行いません。**
- 指摘事項がないスライドについては、何も出力しないでください。
- スライド番号は、提供されたテキストの番号と必ず一致させてください。
- 回答は日本語で行い、JSON以外のテキストは絶対に含めないでください。

---
以下がスライドのテキスト内容です。各スライドは「---SLIDE BREAK---」で区切られています。

プレゼンテーション内容:
${text}
---
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: initialAnalysisSchema,
                temperature: 0.2,
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && !Array.isArray(result)) {
            if (Object.keys(result).length === 0) return []; // Handle empty object
            // Attempt to handle cases where a single object is returned instead of an array
            if(result.slideNumber && result.issue) return [result as AnalysisItem];
            return [];
        }
        return result as AnalysisItem[];
    } catch (error) {
        console.error("Error during initial analysis:", error);
        throw new Error("AIによる一次分析中にエラーが発生しました。");
    }
}

export async function augmentWithLegalBasis(items: AnalysisItem[], yakukihouSummary: string): Promise<AnalysisItem[]> {
    const itemsToCheck = items.filter(item => item.category === '表現');

    if (itemsToCheck.length === 0) {
        return items;
    }

    const issuesToCheck = itemsToCheck.map(item => item.issue);

    const prompt = `
あなたは、日本の薬機法（医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律）を専門とする法律家アシスタントです。
以下の「指摘事項リスト」にある各項目が、提供された「薬機法 要点サマリー」のいずれかの条文に抵触する可能性があるか判断してください。

# 参照資料：薬機法 要点サマリー
${yakukihouSummary}

# 指摘事項リスト
${JSON.stringify(issuesToCheck, null, 2)}

# 指示
- 「指摘事項リスト」の各項目について、最も関連性の高い薬機法の条文を「薬機法 要点サマリー」から見つけ出してください。
- 結果をJSON配列で返してください。配列の各要素は、元の指摘事項と、それに対応する薬機法の根拠条文のペアです。
- 根拠条文は「薬機法 第XX条 YYYY」の形式で記載してください。（例: '薬機法 第66条 誇大広告等の禁止'）
- どの条文にも明確に該当しないと判断した場合は、根拠条文を空文字列（""）にしてください。
- JSON以外のテキストは絶対に含めないでください。
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: legalBasisSchema,
                temperature: 0.1,
            }
        });

        const jsonText = response.text.trim();
        const legalBases: { originalIssue: string; legalBasis: string }[] = JSON.parse(jsonText);

        const legalBasisMap = new Map<string, string>();
        for (const basis of legalBases) {
            if (basis.legalBasis) {
                legalBasisMap.set(basis.originalIssue, basis.legalBasis);
            }
        }
        
        const augmentedItems = items.map(item => {
            const legalBasis = legalBasisMap.get(item.issue);
            if (legalBasis) {
                return { ...item, basis: `${item.basis}\n${legalBasis}` };
            }
            return item;
        });

        return augmentedItems;

    } catch (error) {
        console.error("Error during legal basis augmentation:", error);
        return items;
    }
}