"""Independent XLSX ZIP/XML checks; needs Python's standard library and Node.js."""
import copy
import io
import json
from pathlib import Path
import subprocess
import unittest
import xml.etree.ElementTree as ET
import zipfile

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SOURCE = Path(__file__).resolve().parent
PIPE = {"span": 24, "rise": 24, "thickness": 3, "skew": 0}
NONE = {"span": 0, "rise": 0, "thickness": 0, "skew": 0}


def sample_boxes():
    return [
        {"type": "JB-1", "number": "A-1", "worksheetNumber": "0006", "station": "46+85", "side": "L", "height": None,
         "pipes": [dict(PIPE), dict(NONE), dict(PIPE), dict(NONE)]},
        {"type": "JB-2", "number": "A-2", "worksheetNumber": "7", "station": "100+00", "side": "R", "height": None,
         "pipes": [{"span": 48, "rise": 48, "thickness": 5, "skew": 0}, dict(PIPE), dict(PIPE), dict(PIPE)]},
    ]


def exported(boxes):
    project = {"schema": "jb-project-v1", "projectNumber": "=1+1", "county": "A & B <County> \u03a9\x01", "date": "2026-11-01", "boxes": boxes}
    script = """
const fs = require('node:fs'), calc = require('./calculations.js'), excel = require('./xlsx.js');
const project = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = project.boxes.map(box => calc.calculateBox(box)), totals = calc.totalQuantities(results);
process.stderr.write(JSON.stringify({results, totals}));
process.stdout.write(Buffer.from(excel.createWorkbook(project, results)));
"""
    run = subprocess.run(["node", "-e", script], cwd=SOURCE, input=json.dumps(project).encode(), capture_output=True, check=True)
    archive = zipfile.ZipFile(io.BytesIO(run.stdout))
    if archive.testzip() is not None:
        raise AssertionError("Workbook ZIP checksum failed")
    return archive, json.loads(run.stderr)


def value(sheet, address):
    cell = sheet.find(f'.//s:c[@r="{address}"]', NS)
    if cell.get("t") == "inlineStr":
        return cell.findtext("s:is/s:t", default="", namespaces=NS)
    number = cell.findtext("s:v", namespaces=NS)
    return float(number) if number is not None else None


class ExcelExport(unittest.TestCase):
    def test_main_schedule_values_precision_totals_and_layout(self):
        archive, expected = exported(sample_boxes())
        self.assertEqual(len(archive.namelist()), 6)
        for name in archive.namelist():
            ET.fromstring(archive.read(name))
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        self.assertEqual([s.get("name") for s in workbook.findall("s:sheets/s:sheet", NS)], ["Junction Boxes"])
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        self.assertEqual(sheet.find("s:dimension", NS).get("ref"), "A1:AU13")
        self.assertEqual(value(sheet, "A5"), "0006")
        self.assertEqual(value(sheet, "B3"), "BOX ID")
        self.assertEqual(value(sheet, "B5"), "A-1")
        self.assertEqual(value(sheet, "C5"), "JB-1")
        self.assertEqual(value(sheet, "C6"), "JB-2")
        self.assertEqual(value(sheet, "D5"), "46+85")
        self.assertEqual(value(sheet, "E5"), "LT")
        self.assertEqual(value(sheet, "E6"), "RT")
        self.assertEqual(value(sheet, "F5"), 24)
        self.assertIsNone(value(sheet, "H5"))
        self.assertEqual(value(sheet, "S5"), 2)
        self.assertEqual(value(sheet, "T5"), "@")
        self.assertIn("8-in. box walls", value(sheet, "AU6"))
        self.assertIn("B/C/D #7", value(sheet, "AU6"))
        self.assertNotIn("A-1", value(sheet, "AU5"))
        self.assertNotIn("Left", value(sheet, "AU5"))
        self.assertNotIn("Right", value(sheet, "AU6"))
        self.assertNotIn('4-lb', archive.read('xl/worksheets/sheet1.xml').decode())
        self.assertIsNone(value(sheet, "A2"))
        self.assertIn("Project: =1+1", value(sheet, "A9"))
        for row, result in zip([5, 6], expected["results"]):
            for address, number in [(f"N{row}", result["widthsFeet"][0]), (f"P{row}", result["heightFeet"]),
                                    (f"Q{row}", result["concreteCubicYards"]),
                                    (f"U{row}", result["bars"][0]["lengthInches"]),
                                    (f"AT{row}", sum(b["count"] * b["lengthInches"] for b in result["bars"]))]:
                self.assertAlmostEqual(value(sheet, address), number, places=10)
        self.assertEqual(value(sheet, "Q8"), value(sheet, "Q5") + value(sheet, "Q6"))
        self.assertEqual(value(sheet, "R8"), value(sheet, "R5") + value(sheet, "R6"))
        self.assertEqual(sheet.findtext('.//s:c[@r="Q8"]/s:f', namespaces=NS), 'SUM(Q5:Q6)')
        self.assertEqual(sheet.findtext('.//s:c[@r="R8"]/s:f', namespaces=NS), 'SUM(R5:R6)')
        self.assertEqual(sheet.findtext('.//s:c[@r="R5"]/s:f', namespaces=NS), 'AT5*0.055663')
        self.assertIn('S5*U5', sheet.findtext('.//s:c[@r="AT5"]/s:f', namespaces=NS))
        self.assertIn('AQ5*AS5', sheet.findtext('.//s:c[@r="AT5"]/s:f', namespaces=NS))
        self.assertTrue(sheet.findtext('.//s:c[@r="R6"]/s:f', namespaces=NS).endswith('+3.3'))
        self.assertIn('/12*2.044', sheet.findtext('.//s:c[@r="R6"]/s:f', namespaces=NS))
        self.assertAlmostEqual(value(sheet, 'R5'), value(sheet, 'AT5') * .055663, places=10)
        weights = {4: .668, 6: 1.502, 7: 2.044}
        self.assertAlmostEqual(value(sheet, 'R6'), sum(b['count'] * b['lengthInches'] / 12 * weights[b['size']] for b in expected['results'][1]['bars']) + 3.3, places=10)
        merges = {m.get("ref") for m in sheet.findall("s:mergeCells/s:mergeCell", NS)}
        self.assertTrue({"A1:AU1", "F3:G3", "S3:AS3", "S4:U4", "A8:P8"}.issubset(merges))
        self.assertEqual(sheet.find("s:pageSetup", NS).get("orientation"), "landscape")
        self.assertEqual(sheet.find("s:sheetViews/s:sheetView/s:pane", NS).get("topLeftCell"), "F5")
        self.assertEqual(len(sheet.findall(".//s:f", NS)), 6)
        self.assertEqual(workbook.find('s:calcPr', NS).get('calcMode'), 'auto')
        widths = {int(c.get('min')): float(c.get('width')) for c in sheet.findall('s:cols/s:col', NS)}
        self.assertTrue(all(widths[c] == 4 for c in range(20, 45, 3)))
        self.assertEqual(widths[19], 4)
        self.assertEqual(widths[21], 7)

    def test_literal_text_unicode_arch_size_and_no_external_links(self):
        boxes = sample_boxes()[:1]
        del boxes[0]['worksheetNumber']
        boxes[0]["station"] = '=HYPERLINK("https://example.invalid","test")'
        boxes[0]["pipes"][0] = {"span": 22, "rise": 13, "thickness": 2.5, "skew": -10}
        archive, _ = exported(boxes)
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        self.assertEqual(value(sheet, "D5"), boxes[0]["station"])
        self.assertIsNone(value(sheet, "A5"))
        self.assertEqual(value(sheet, "F5"), "22 x 13")
        self.assertEqual(value(sheet, "G5"), -10)
        self.assertIn("=1+1", value(sheet, "A8"))
        self.assertIn("A & B <County> \u03a9", value(sheet, "A8"))
        self.assertNotIn("\x01", value(sheet, "A8"))
        self.assertEqual(sheet.find('.//s:c[@r="D5"]', NS).get("t"), "inlineStr")
        self.assertIsNone(sheet.find('.//s:c[@r="D5"]/s:f', NS))
        for name in ["_rels/.rels", "xl/_rels/workbook.xml.rels"]:
            self.assertNotIn(b'TargetMode="External"', archive.read(name))

    def test_fifty_boxes_have_exactly_fifty_detail_rows_and_correct_totals(self):
        boxes = [copy.deepcopy(sample_boxes()[i % 2]) for i in range(50)]
        archive, expected = exported(boxes)
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        self.assertEqual(sheet.find("s:dimension", NS).get("ref"), "A1:AU61")
        self.assertEqual(len(sheet.findall("s:sheetData/s:row", NS)), 61)
        self.assertEqual(value(sheet, "C54"), "JB-2")
        self.assertAlmostEqual(value(sheet, "Q56"), sum(value(sheet, f'Q{row}') for row in range(5, 55)), places=10)
        self.assertAlmostEqual(value(sheet, "R56"), sum(value(sheet, f'R{row}') for row in range(5, 55)), places=9)
        self.assertEqual(sheet.findtext('.//s:c[@r="Q56"]/s:f', namespaces=NS), 'SUM(Q5:Q54)')
        self.assertEqual(sheet.findtext('.//s:c[@r="R56"]/s:f', namespaces=NS), 'SUM(R5:R54)')


if __name__ == "__main__":
    unittest.main()
