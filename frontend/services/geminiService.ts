

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
                description: "指摘の根拠。初期分析では空文字列にしてください。",
            },
            issue: {
                type: Type.STRING,
                description: "ルールに抵触する可能性のある具体的な指摘事項。",
            },
            suggestion: {
                type: Type.STRING,
                description: "指摘事項に対する具体的な改善案や書き換えの提案。",
            },
            correctionType: {
                type: Type.STRING,
                enum: ['必須', '任意'],
                description: "指摘事項の修正の必要度合い。『必須』または『任意』のいずれかを指定。",
            },
        },
        required: ["slideNumber", "category", "issue", "suggestion", "correctionType"],
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
あなたは、医療・製薬・ヘルスケア業界向けのスライド資料を専門とする、経験豊富なコンプライアンス・エディターです。
ユーザーが作成したスライド資料のテキスト内容が提供されます。あなたは、クライアントである医師や研究者に対して、敬意を払い、プロフェッショナルな姿勢で改善提案を行います。
以下に示す「チェック対象ルール」に準拠しているか厳しくチェックし、違反している可能性のある項目を指摘してください。

# チェック対象ルール
${rulesText}

# 出力トーンと修正種別のガイドライン
指摘事項は「必須」と「任意」の2種類に分類してください。

## 1. 必須 (correctionType: '必須')
- **定義**: ルールに明確に違反しており、コンプライアンス上、修正が強く求められる項目。
- **対象ルール**: 特にルール2（製品名）、ルール4（断定的表現）、ルール5（医療行為表現）、ルール8（特定機関への誘導）、ルール9（一般広告表現）など、規制や社内規定に直結する項目。
- **指摘事項 (issue) のトーン**: 「〜という表現は、ルールXに抵触する可能性があります。」のように、根拠を明確に示します。
- **改善案 (suggestion) のトーン**: 「つきましては、〜へのご修正をお願いいたします。」や「〜といった表現への変更をご検討ください。」のように、丁寧かつ明確に修正を促します。

## 2. 任意 (correctionType: '任意')
- **定義**: 厳密な違反ではないものの、誤解を招く可能性があったり、より良い表現への改善が推奨される項目。
- **対象ルール**: ルール1（誤植）、ルール3（恐怖訴求）、ルール6（誇大表現）、ルール7（出典）など、表現のニュアンスや推奨事項に関する項目。
- **指摘事項 (issue) のトーン**: 「〜という表現は、読み手に意図しない印象を与える可能性があります。」のように、懸念点を柔らかく伝えます。
- **改善案 (suggestion) のトーン**: 「〜のように変更いただくと、より明確になります。」や「〜という表現はいかがでしょうか。」のように、提案ベースの言い方をします。

# その他の指示
- 指摘の根拠(basis)は、この段階では空文字列としてください。
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
        
        // Ensure result is an array before mapping
        let analysisItems: Omit<AnalysisItem, 'id'>[] = [];
        if (Array.isArray(result)) {
            analysisItems = result;
        } else if (result && typeof result === 'object' && !Array.isArray(result)) {
             if (Object.keys(result).length === 0) return []; // Handle empty object
            // Handle cases where a single object is returned
            if(result.slideNumber && result.issue) {
                analysisItems = [result];
            }
        }

        return analysisItems.map((item): AnalysisItem => ({ 
            ...item, 
            id: crypto.randomUUID(), // Add a unique ID
            basis: item.basis || '',
            correctionType: item.correctionType || '任意'
        }));
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
                return { ...item, basis: legalBasis };
            }
            return item;
        });

        return augmentedItems;

    } catch (error) {
        console.error("Error during legal basis augmentation:", error);
        return items;
    }
}