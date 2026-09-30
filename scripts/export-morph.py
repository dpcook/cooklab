"""Export the title-slide morph from the 2026 Queen's seminar deck for the homepage.

Reads window.DATA.morph from the deck's data/data.js (80,000 cells, one HGSC
section) and writes public/data/morph.bin:

  uint32  n
  uint16  umapX[n], umapY[n], spatialX[n], spatialY[n]   (-0.5..0.5 scaled to 0..65535)
  uint8   label[n]                                       (index into the deck's 19 labels)

The label colours are copied into src/components/HeroMorph.astro. The sample ID
is not exported.

Usage: python3 scripts/export-morph.py "<deck>/data/data.js"
"""
import json
import struct
import sys
from pathlib import Path

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'morph.bin'

text = src.read_text()
m = json.loads(text[text.index('{'):text.rindex('}') + 1])['morph']
n = m['n']

def q(v):
    return max(0, min(65535, round((v + 0.5) * 65535)))

with out.open('wb') as f:
    f.write(struct.pack('<I', n))
    for key in ('umapX', 'umapY', 'spatialX', 'spatialY'):
        f.write(struct.pack(f'<{n}H', *(q(v) for v in m[key])))
    f.write(bytes(m['label']))

print(f'{n} cells -> {out} ({out.stat().st_size:,} bytes)')
print('colors:', json.dumps(m['colors']))
