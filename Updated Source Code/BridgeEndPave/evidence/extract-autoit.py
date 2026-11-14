"""Recover the supplied binary's embedded script without executing the EXE."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--package-path", type=Path, help="Existing pip --target folder containing autoit-ripper 1.2.0")
args = parser.parse_args()
if args.package_path:
    sys.path.insert(0, str(args.package_path.resolve()))

from autoit_ripper import extract
from autoit_ripper.autoit_unpack import EA05_MAGIC

assert importlib.metadata.version("autoit-ripper") == "1.2.0", "Use the recorded extractor version"
evidence = Path(__file__).resolve().parent
binary = evidence.parents[2] / "Legacy" / "BridgeEndPave.exe"
data = binary.read_bytes()
source_digest = hashlib.sha256(data).hexdigest()
assert source_digest == "114820772dbd045a88a32b6c23287057396fac691fe523bfd57fc1d41274f323", "Unexpected source binary"
records = extract(data)
assert records is not None and len(records) == 1 and records[0][0] == "script.au3", "Unexpected container records"
script = records[0][1]
assert script.startswith(b"Global Const $GUI_EVENT_CLOSE"), "Unexpected recovered script"
destination = evidence / "recovered-script.au3"
destination.write_bytes(script)
manifest = {
    "source": "Legacy/BridgeEndPave.exe",
    "source_bytes": len(data),
    "source_sha256": source_digest,
    "extractor": "autoit-ripper 1.2.0",
    "extractor_source": "https://github.com/nazywam/AutoIt-Ripper",
    "locator_offset": data.index(EA05_MAGIC),
    "ea06_marker_offset": data.index(b"AU3!EA06"),
    "extraction_route": "extract(data), appended container with EA06 bytecode",
    "output": destination.name,
    "output_bytes": len(script),
    "output_sha256": hashlib.sha256(script).hexdigest(),
    "runtime_execution": False,
}
(evidence / "extraction-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(json.dumps(manifest, indent=2))
