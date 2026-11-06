"""Roda o pipeline completo: coleta no PubMed e depois resumos em portugues."""
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
for script in ("fetch_pubmed.py", "summarize.py"):
    print(f"\n=== {script} ===")
    subprocess.run([sys.executable, str(AQUI / script)] + sys.argv[1:], check=True)
