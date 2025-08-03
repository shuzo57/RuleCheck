import json

import google.generativeai as genai
from app.core.settings import API_KEY
from app.services.schemas import (AnalysisItem, initial_analysis_schema,
                                  legal_basis_schema)

genai.configure(api_key=API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")

async def _call_llm(prompt: str, schema: dict, temperature: float):
    res = _model.generate_content(
        contents=prompt,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": schema,
            "temperature": temperature,
        },
    )
    return json.loads(res.text or "[]")

async def analyze(slide_text: str, rules_text: str, yakukihou_summary: str):
    prompt1 = (
        "あなたは医療・製薬・ヘルスケア資料のコンプライアンス専門家です。\n"
        "次の社内ルールに違反しているスライドを JSON 配列で指摘してください。\n\n"
        f"# 社内ルール\n{rules_text}\n\n# スライド本文\n{slide_text}"
    )
    initial_items = [AnalysisItem(**x) for x in await _call_llm(prompt1, initial_analysis_schema, 0.2)]

    targets = [i.issue for i in initial_items if i.category == "表現"]
    if not targets:
        return [i.model_dump() for i in initial_items]

    prompt2 = (
        "あなたは薬機法の専門家です。以下の文が薬機法に抵触するか判断し、該当条文を返してください。\n\n"
        f"# 薬機法サマリー\n{yakukihou_summary}\n\n"
        f"# 指摘事項\n{json.dumps(targets, ensure_ascii=False)}"
    )
    legal_pairs = await _call_llm(prompt2, legal_basis_schema, 0.1)
    legal_map = {p["originalIssue"]: p["legalBasis"] for p in legal_pairs if p["legalBasis"]}

    for item in initial_items:
        if item.issue in legal_map:
            item.basis += f"\n{legal_map[item.issue]}"

    return [i.model_dump() for i in initial_items]
