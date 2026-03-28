# pipeline.py — Mini FLUX Main Pipeline
# Orchestrates the full data curation flow:
# Load → Clean → Filter → Deduplicate → Quality Score → Save

import json
import argparse
from pathlib import Path
from utils import (
    load_documents,
    clean_text,
    is_good_line,
    deduplicate,
    filter_by_quality,
    quality_score
)


def clean_document_lines(document: str, min_words: int = 5) -> str:
    """
    FLUX-style line-level cleaning.
    Removes bad lines surgically — does NOT delete entire documents.
    """
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


def split_into_sentences(documents: list) -> list:
    """Split documents into individual sentences."""
    sentences = []
    for doc in documents:
        for terminator in ['!', '?']:
            doc = doc.replace(terminator, '.')
        parts = [s.strip() for s in doc.split('.')]
        sentences.extend([s for s in parts if s])
    return sentences


def run_pipeline(data_dir='data/', output_dir='output/',
                 threshold=0.50, min_words=5):
    """
    Run the complete Mini FLUX data curation pipeline.
    """
    print('\n' + '='*50)
    print('   Mini FLUX — Smart Data Curation Pipeline')
    print('='*50 + '\n')

    Path(output_dir).mkdir(exist_ok=True)

    print('Step 1: Loading documents...')
    documents = load_documents(data_dir)
    if not documents:
        print('ERROR: No .txt files found in data/ folder.')
        return
    original_doc_count = len(documents)

    print('\nSteps 2-4: Cleaning + Line-Level Filtering...')
    cleaned_docs = []
    for doc in documents:
        cleaned = clean_document_lines(doc, min_words=min_words)
        if cleaned.strip():
            cleaned_docs.append(cleaned)
    print(f'[CLEAN] {original_doc_count} → {len(cleaned_docs)} documents after cleaning')

    all_sentences = split_into_sentences(cleaned_docs)
    sentences_before_dedup = len(all_sentences)
    print(f'[SPLIT] {sentences_before_dedup} total sentences extracted')

    print('\nStep 5: Deduplication...')
    unique_sentences = deduplicate(all_sentences)

    print('\nStep 6: Quality Scoring...')
    final_sentences = filter_by_quality(unique_sentences, threshold=threshold)

    print('\nStep 7: Token count estimate...')
    tokens_before = sum(len(s.split()) for s in all_sentences)
    tokens_after  = sum(len(s.split()) for s in final_sentences)
    print(f'[TOKENS] Before: ~{tokens_before:,} | After: ~{tokens_after:,}')

    print('\nStep 8: Saving output...')

    removed_pct  = round((1 - len(final_sentences) / max(sentences_before_dedup, 1)) * 100, 1)
    retained_pct = round(100 - removed_pct, 1)
    noise_token_pct = round((1 - tokens_after / max(tokens_before, 1)) * 100, 1)

    stats = {
        'documents_loaded':         original_doc_count,
        'documents_after_clean':    len(cleaned_docs),
        'sentences_original':       sentences_before_dedup,
        'sentences_after_dedup':    len(unique_sentences),
        'sentences_final':          len(final_sentences),
        'removed_pct':              removed_pct,
        'retained_pct':             retained_pct,
        'tokens_before':            tokens_before,
        'tokens_after':             tokens_after,
        'noise_tokens_removed_pct': noise_token_pct,
        'quality_threshold':        threshold,
    }

    with open(f'{output_dir}cleaned_data.json', 'w', encoding='utf-8') as f:
        json.dump(final_sentences, f, indent=2, ensure_ascii=False)

    with open(f'{output_dir}stats.json', 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    print('\n' + '='*50)
    print('   PIPELINE COMPLETE — Summary')
    print('='*50)
    print(f'  Documents loaded:        {original_doc_count}')
    print(f'  Sentences (original):    {sentences_before_dedup:,}')
    print(f'  Sentences (final):       {len(final_sentences):,}')
    print(f'  Noise removed:           {removed_pct}%')
    print(f'  Data retained:           {retained_pct}%')
    print(f'  Tokens before:           ~{tokens_before:,}')
    print(f'  Tokens after:            ~{tokens_after:,}')
    print(f'  Noise tokens removed:    {noise_token_pct}%')
    print(f'\n  Output saved to: {output_dir}')
    print('='*50 + '\n')

    return final_sentences, stats


def parse_args():
    parser = argparse.ArgumentParser(
        description='Mini FLUX — Smart Data Curation Pipeline'
    )
    parser.add_argument('--data-dir',   default='data/',   help='Input folder (default: data/)')
    parser.add_argument('--output-dir', default='output/', help='Output folder (default: output/)')
    parser.add_argument('--threshold',  type=float, default=0.50,
                        help='Quality score threshold 0.0-1.0 (default: 0.50)')
    parser.add_argument('--min-words',  type=int, default=5,
                        help='Minimum words per line (default: 5)')
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()
    run_pipeline(
        data_dir=args.data_dir,
        output_dir=args.output_dir,
        threshold=args.threshold,
        min_words=args.min_words
    )
