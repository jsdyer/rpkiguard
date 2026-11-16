#!/usr/bin/env python3
"""Copy the self-contained RPKI Guard site to dist."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
shutil.copytree(root / "web", root / "dist", dirs_exist_ok=True)
