"""Developer-only: embed the twelve inspected MDOT reference sheets as PNG data."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import fitz


def digest(path):
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def build(standard_path):
    root = Path(__file__).resolve().parent
    references = root / 'evidence' / 'reference-drawings'
    standard_sha = 'd7d1283a65316ad5da0a39eab459ccfda15f80687a72c7edbb6f4a8daa6ecb99'
    assert digest(standard_path) == standard_sha, 'Use the inspected standard drawing set.'
    standard_titles = [
        ('BE-1', 'Bridge end pavement with rail, overlay and sleeper slab'),
        ('BE-2', 'Bridge end pavement with rail and overlay'),
        ('BER-1', '33.5-inch bridge end pavement rail'),
        ('BER-2', '43.5-inch bridge end pavement rail'),
    ]
    sheets = {}

    def render(page, identity, title, source, sha, source_page):
        assert page.rect.width > page.rect.height, 'Reference sheet must be landscape.'
        scale = 3200 / page.rect.width
        png = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csGRAY, alpha=False).tobytes('png')
        assert png.startswith(b'\x89PNG\r\n\x1a\n')
        sheets[identity] = {'id': identity, 'title': title, 'source': source,
                            'sha256': sha, 'page': source_page,
                            'image': 'data:image/png;base64,' + base64.b64encode(png).decode('ascii')}

    with fitz.open(standard_path) as document:
        for page_index, (identity, title) in enumerate(standard_titles, 9):
            render(document[page_index], identity, title,
                   'MDOT Roadway Design Standard Drawings, sheet ' + str(6007 + page_index - 9) + ', issued August 1, 2017',
                   standard_sha, page_index + 1)
    manifest = json.loads((references / 'manifest.json').read_text(encoding='utf-8'))
    assert len(manifest['files']) == 8, 'Expected the eight inspected special sheets.'
    for entry in manifest['files']:
        path = references / entry['file']
        assert path.parent == references and path.suffix == '.pdf'
        assert digest(path) == entry['sha256'], 'Reference PDF identity changed: ' + path.name
        with fitz.open(path) as document:
            assert len(document) == 1
            render(document[0], path.stem, entry['title'].removesuffix('.pdf'),
                   entry['url'], entry['sha256'], 1)
    assert len(sheets) == 12
    text = "'use strict';\n// Generated from the inspected MDOT PDFs; see build-drawing-assets.py.\nconst BridgeEndSheets = " + json.dumps(sheets, ensure_ascii=True, separators=(',', ':')) + ';\n'
    assert '</script' not in text.lower()
    (root / 'drawing-sheets.js').write_text(text, encoding='utf-8', newline='\n')
    metadata = [{key: value for key, value in sheet.items() if key != 'image'} for sheet in sheets.values()]
    (root / 'evidence' / 'drawing-assets.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Embedded {len(sheets)} complete reference sheets ({len(text.encode())} bytes).')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--standard-pdf', required=True, type=Path)
    build(parser.parse_args().standard_pdf)
