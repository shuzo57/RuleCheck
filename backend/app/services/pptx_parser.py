from pathlib import Path
from typing import IO, Union
from xml.etree import ElementTree as ET

from fastapi import UploadFile
from pptx import Presentation


class PptxConverter:
    class UnsupportedInput(TypeError):
        pass

    @staticmethod
    def _load_presentation(
        src: Union[str, Path, bytes, IO[bytes], UploadFile],
    ) -> Presentation:
        if isinstance(src, (str, Path)):
            p = Path(src)
            if not p.exists():
                raise FileNotFoundError(p)
            return Presentation(p)
        if isinstance(src, bytes):
            return Presentation(src)
        if hasattr(src, "read"):
            data = (
                src.read()
                if not isinstance(src, UploadFile)
                else src.file.read()
            )
            return Presentation(data)
        raise PptxConverter.UnsupportedInput(type(src))

    @staticmethod
    def convert_to_xml(
        src: Union[str, Path, bytes, IO[bytes], UploadFile],
        encoding: str = "utf-8",
        pretty: bool = True,
    ) -> str:
        prs = PptxConverter._load_presentation(src)
        root = ET.Element("Document")
        for idx, slide in enumerate(prs.slides, 1):
            s_el = ET.SubElement(root, "Slide", number=str(idx))
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    ET.SubElement(s_el, "Text").text = shape.text.strip()
                if shape.shape_type == 13:
                    img = shape.image
                    caption = (
                        shape._element.xpath(".//p:cNvPr")[0].get("descr")
                        or ""
                    )
                    ET.SubElement(
                        s_el, "Image", name=img.filename, caption=caption
                    )

        if pretty:
            if hasattr(ET, "indent"):
                ET.indent(root, space="  ", level=0)
                return ET.tostring(
                    root, encoding=encoding, xml_declaration=True
                ).decode(encoding)
            from xml.dom import minidom

            raw = ET.tostring(root, encoding=encoding, xml_declaration=True)
            return (
                minidom.parseString(raw)
                .toprettyxml(indent="  ", encoding=encoding)
                .decode(encoding)
            )

        return ET.tostring(
            root, encoding=encoding, xml_declaration=True
        ).decode(encoding)
