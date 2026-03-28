# backend/app.py — DataCleanX Flask API
# Accepts .txt file uploads, runs the FLUX pipeline, and returns
# cleaned sentences + full stats/chart data as JSON.

import sys
import os
import hashlib

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Add project root to path so utils.py is importable
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)
from utils import clean_text, is_good_line, quality_score

# Path to the React production build
STATIC_DIR = os.path.join(ROOT_DIR, 'frontend', 'dist')

app = Flask(__name__, static_folder=None)
CORS(app)


# ── Pipeline helpers (silent versions — no print statements) ─────────────────

def _clean_document_lines(document: str, min_words: int = 5) -> str:
    lines = document.split('\n')
    good_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        cleaned = clean_text(line)
        if is_good_line(cleaned, min_words=min_words):
            good_lines.append(cleaned)
    return ' '.join(good_lines)


def _split_into_sentences(documents: list) -> list:
    sentences = []
    for doc in documents:
        for terminator in ['!', '?']:
            doc = doc.replace(terminator, '.')
        parts = [s.strip() for s in doc.split('.')]
        sentences.extend([s for s in parts if s])
    return sentences


def _deduplicate(sentences: list) -> tuple:
    seen: set = set()
    unique: list = []
    removed = 0
    for sentence in sentences:
        h = hashlib.sha256(sentence.encode('utf-8')).hexdigest()
        if h not in seen:
            seen.add(h)
            unique.append(sentence)
        else:
            removed += 1
    return unique, removed


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'DataCleanX API'})


@app.route('/api/clean', methods=['POST'])
def clean_files():
    files = request.files.getlist('files')
    threshold = float(request.form.get('threshold', 0.50))
    min_words = int(request.form.get('min_words', 5))

    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No files uploaded'}), 400

    documents: list = []
    file_names: list = []

    for f in files:
        if not f.filename.endswith('.txt'):
            continue
        text = f.read().decode('utf-8', errors='ignore').strip()
        if text:
            documents.append(text)
            file_names.append(f.filename)

    if not documents:
        return jsonify({'error': 'No valid .txt files found. Please upload .txt files.'}), 400

    original_doc_count = len(documents)

    # Steps 2–4: Clean + line-level filter
    cleaned_docs: list = []
    for doc in documents:
        cleaned = _clean_document_lines(doc, min_words=min_words)
        if cleaned.strip():
            cleaned_docs.append(cleaned)

    # Split to sentences
    all_sentences = _split_into_sentences(cleaned_docs)
    sentences_before_dedup = len(all_sentences)

    # Step 5: Deduplicate
    unique_sentences, duplicates_removed = _deduplicate(all_sentences)

    # Step 6: Score all unique sentences
    scored = [(s, quality_score(s)) for s in unique_sentences]
    all_scores = [sc for _, sc in scored]

    # Score distribution — 10 buckets 0.0–1.0
    bucket_labels = [f'{i/10:.1f}–{(i+1)/10:.1f}' for i in range(10)]
    bucket_counts = [0] * 10
    for sc in all_scores:
        idx = min(int(sc * 10), 9)
        bucket_counts[idx] += 1

    # Filter by threshold
    final_pairs = [(s, sc) for s, sc in scored if sc >= threshold]
    final_sentences = [s for s, _ in final_pairs]
    final_scores = [sc for _, sc in final_pairs]

    avg_quality = round(sum(final_scores) / len(final_scores), 3) if final_scores else 0.0

    # Token estimates
    tokens_before = sum(len(s.split()) for s in all_sentences)
    tokens_after = sum(len(s.split()) for s in final_sentences)

    removed_count = sentences_before_dedup - len(final_sentences)
    removed_pct = round(removed_count / max(sentences_before_dedup, 1) * 100, 1)
    retained_pct = round(100 - removed_pct, 1)
    noise_token_pct = round((1 - tokens_after / max(tokens_before, 1)) * 100, 1)

    return jsonify({
        'stats': {
            'documents_loaded': original_doc_count,
            'documents_after_clean': len(cleaned_docs),
            'sentences_original': sentences_before_dedup,
            'sentences_after_dedup': len(unique_sentences),
            'duplicates_removed': duplicates_removed,
            'sentences_final': len(final_sentences),
            'removed_pct': removed_pct,
            'retained_pct': retained_pct,
            'tokens_before': tokens_before,
            'tokens_after': tokens_after,
            'noise_tokens_removed_pct': noise_token_pct,
            'avg_quality_score': avg_quality,
            'quality_threshold': threshold,
            'file_names': file_names,
        },
        'pipeline_stages': [
            {'stage': 'Raw Input', 'sentences': sentences_before_dedup},
            {'stage': 'After Dedup', 'sentences': len(unique_sentences)},
            {'stage': 'Final Output', 'sentences': len(final_sentences)},
        ],
        'score_distribution': [
            {'range': bucket_labels[i], 'count': bucket_counts[i]}
            for i in range(10)
        ],
        'noise_retained': [
            {'name': 'Retained', 'value': len(final_sentences)},
            {'name': 'Removed', 'value': removed_count},
        ],
        'token_comparison': [
            {'name': 'Before', 'tokens': tokens_before},
            {'name': 'After', 'tokens': tokens_after},
        ],
        'cleaned_sentences': final_sentences,
    })


# ── Serve React SPA in production ─────────────────────────────────────────────
# In development the Vite dev server proxies /api → Flask.
# In production Flask itself serves the built React files so the app needs no
# separate static host.

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # Static assets (JS, CSS, images …) — serve directly
    target = os.path.join(STATIC_DIR, path)
    if path and os.path.isfile(target):
        return send_from_directory(STATIC_DIR, path)
    # Everything else (React client-side routes) → index.html
    index = os.path.join(STATIC_DIR, 'index.html')
    if os.path.isfile(index):
        return send_from_directory(STATIC_DIR, 'index.html')
    return jsonify({'error': 'Frontend not built. Run: cd frontend && npm run build'}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)
