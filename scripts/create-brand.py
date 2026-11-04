"""Compatibility entry point for the approved, user-supplied logo."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('trace-brand.py')),run_name='__main__')
