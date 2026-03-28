# tests/_debug.py — Shared debug logger for DataCleanX test suite
# Writes NDJSON lines to the Cursor debug log path for this session.

import json
import time
import os

LOG_PATH = '/Users/kadiyalarajesh/Downloads/FLUX_DATA_CLEANING/.cursor/debug-186305.log'
SESSION_ID = '186305'


def dlog(message: str, data: dict = None, hypothesis_id: str = '', location: str = '', run_id: str = 'run1'):
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    entry = {
        'sessionId': SESSION_ID,
        'id': f'log_{int(time.time() * 1000)}',
        'timestamp': int(time.time() * 1000),
        'location': location,
        'message': message,
        'data': data or {},
        'runId': run_id,
        'hypothesisId': hypothesis_id,
    }
    with open(LOG_PATH, 'a') as f:
        f.write(json.dumps(entry) + '\n')
