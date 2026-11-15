"""Recover the embedded AutoIt script without executing or modifying strexc.exe."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--package-path', type=Path)
args = parser.parse_args()
if args.package_path:
    sys.path.insert(0, str(args.package_path.resolve()))
from autoit_ripper import extract

assert importlib.metadata.version('autoit-ripper') == '1.2.0'
evidence = Path(__file__).resolve().parent
data = (evidence.parents[2] / 'Legacy' / 'strexc.exe').read_bytes()
digest = hashlib.sha256(data).hexdigest()
assert digest == 'e9978456ced24aca404ea9d33665d17bfdc26f36d0d24b157ef8e95075df7b63'
records = extract(data)
assert records is not None and len(records) == 1 and records[0][0] == 'script.au3'
script = records[0][1]
(evidence / 'recovered-script.au3').write_bytes(script)
manifest = dict(source='Legacy/strexc.exe', source_sha256=digest, source_bytes=len(data),
                extractor='autoit-ripper 1.2.0', runtime_execution=False,
                output='recovered-script.au3', output_bytes=len(script),
                output_sha256=hashlib.sha256(script).hexdigest())
(evidence / 'extraction-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest))
