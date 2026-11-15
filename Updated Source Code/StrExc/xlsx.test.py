"""Inspect exported XLSX packages independently of the browser ZIP writer."""
from pathlib import Path
from zipfile import ZipFile
import math
import openpyxl
import xml.etree.ElementTree as ET

folder = Path(__file__).resolve().parent / 'evidence'
for name, count in [('sample-export.xlsx',2),('large-export.xlsx',500)]:
    file = folder / name
    with ZipFile(file) as archive:
        assert archive.testzip() is None
        for part in archive.namelist():
            if part.endswith(('.xml','.rels')):
                ET.fromstring(archive.read(part))
        assert not any('externalLink' in part for part in archive.namelist())
    formulas = openpyxl.load_workbook(file, data_only=False)
    values = openpyxl.load_workbook(file, data_only=True)
    assert formulas.sheetnames == ['Structure excavation']
    sheet, cached = formulas.active, values.active
    assert sheet.freeze_panes == 'C5'
    assert sheet.auto_filter.ref == f'A4:L{count+4}'
    assert len(sheet.data_validations.dataValidation) == 3
    total = 0
    for row in range(5,count+5):
        assert cached[f'B{row}'].data_type == 's'
        assert all(cached[f'{col}{row}'].data_type == 'n' for col in 'EFGHIJKL')
        span,length,depth,fes,factor = [cached[f'{col}{row}'].value for col in 'EFGHI']
        trench = ((span+24)/12)*length*depth/27
        ends = fes*factor*depth
        for col,expected in [('J',trench),('K',ends),('L',trench+ends)]:
            assert math.isclose(cached[f'{col}{row}'].value,expected,abs_tol=1e-9)
        assert sheet[f'J{row}'].value == f'=((E{row}+24)/12)*F{row}*G{row}/27'
        assert sheet[f'K{row}'].value == f'=H{row}*I{row}*G{row}'
        assert sheet[f'L{row}'].value == f'=J{row}+K{row}'
        total += trench+ends
    assert sheet[f'L{count+5}'].value == f'=SUM(L5:L{count+4})'
    assert math.isclose(cached[f'L{count+5}'].value,total,abs_tol=1e-9)
    assert sheet['L5'].number_format == '#,##0.000'
    assert sheet[f'L{count+5}'].number_format == '#,##0.00'
    notes = [sheet[f'A{row}'] for row in range(count+6,count+10)]
    assert sheet.max_row == count+9
    assert all(note.font.sz == 9 and note.font.i for note in notes)
    assert not any('Legacy EXE runtime comparison' in str(cell.value) for row in sheet for cell in row)
    print(f'PASS: {name}: {count} pipes, formulas, typed inputs, cached results, totals, styles, validation, freeze/filter, valid XML/ZIP.')
