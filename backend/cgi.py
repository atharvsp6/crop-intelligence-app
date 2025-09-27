"""Minimal compatibility shim for the removed 'cgi' stdlib module (Python 3.13+).
Provides only parse_header needed by legacy httpx/googletrans stack.
"""
from typing import Tuple, Dict

def parse_header(line: str) -> Tuple[str, Dict[str, str]]:
    if not isinstance(line, str):
        line = str(line)
    parts = [p.strip() for p in line.split(';')]
    if not parts:
        return '', {}
    key = parts[0]
    params: Dict[str,str] = {}
    for seg in parts[1:]:
        if '=' in seg:
            k,v = seg.split('=',1)
            params[k.strip().lower()] = v.strip().strip('"')
        elif seg:
            params[seg.lower()] = ''
    return key, params

__all__ = ['parse_header']
