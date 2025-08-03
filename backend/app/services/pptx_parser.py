from pathlib import Path

from pptx import Presentation


def parse_pptx(path: Path) -> str:
    """
    .pptx ファイルからスライドごとのプレーンテキストを抽出し、
    ---SLIDE BREAK--- で区切った 1 本の文字列を返す。
    """
    prs = Presentation(path)
    slides_text: list[str] = []

    for idx, slide in enumerate(prs.slides, start=1):
        # 形状オブジェクトのうち text 属性を持つものを抽出
        texts = [shape.text for shape in slide.shapes if hasattr(shape, "text")]
        joined = " ".join(t.strip() for t in texts if t.strip())
        slides_text.append(f"[スライド {idx}]\n{joined}")

    return "\n\n---SLIDE BREAK---\n\n".join(slides_text)
