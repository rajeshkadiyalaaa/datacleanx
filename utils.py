# utils.py — Mini FLUX Utility Functions
# Provides all helper functions used by the pipeline:
# loading, cleaning, heuristic filtering, deduplication, and quality scoring.

import re
import hashlib
from collections import Counter
from pathlib import Path

STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
    'be', 'been', 'have', 'has', 'had', 'this', 'that', 'it', 'its',
    'which', 'who', 'what', 'when', 'where', 'how', 'not', 'as', 'if'
}


def load_documents(data_dir: str) -> list:
    """Load all .txt files from a directory."""
    documents = []
    data_path = Path(data_dir)

    for filepath in data_path.glob('*.txt'):
        try:
            text = filepath.read_text(encoding='utf-8', errors='ignore').strip()
            if text:
                documents.append(text)
        except Exception as e:
            print(f'Warning: Could not read {filepath}: {e}')

    print(f'[LOAD] Loaded {len(documents)} documents from "{data_dir}"')
    return documents


def clean_text(text: str) -> str:
    """
    Clean raw text:
    - Remove HTML tags
    - Remove URLs and emails
    - Remove non-ASCII characters
    - Remove special characters
    - Normalize whitespace
    - Convert to lowercase
    """
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'http\S+|www\.\S+', ' ', text)
    text = re.sub(r'\S+@\S+\.\S+', ' ', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r"[^a-zA-Z0-9\s.,!?;:'\-]", ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()


def is_good_line(line: str, min_words: int = 5) -> bool:
    """
    Heuristic filter — returns True if line is worth keeping.

    Rules (FLUX-inspired):
    - Must have at least min_words words
    - Not too long (likely auto-generated if > 2000 chars)
    - At least 60% alphabetic characters
    - Less than 40% digit characters
    - No single word repeated more than 30% of total words
    """
    words = line.split()

    if len(words) < min_words:
        return False

    if len(line) > 2000:
        return False

    alpha_chars = sum(1 for c in line if c.isalpha())
    if len(line) > 0 and alpha_chars / len(line) < 0.60:
        return False

    digit_chars = sum(1 for c in line if c.isdigit())
    if len(line) > 0 and digit_chars / len(line) > 0.40:
        return False

    if words:
        counts = Counter(words)
        top_count = counts.most_common(1)[0][1]
        # Only penalise if a word genuinely repeats (top_count > 1).
        # Without this guard, any 3-word sentence with all-unique words fails
        # because 1/3 = 0.33 > 0.30, even though nothing is repeated.
        if top_count > 1 and top_count / len(words) > 0.30:
            return False

    return True


def deduplicate(sentences: list) -> list:
    """
    Remove exact duplicate sentences using SHA-256 hashing.
    Preserves the order of first occurrences.
    """
    seen = set()
    unique = []
    removed = 0

    for sentence in sentences:
        h = hashlib.sha256(sentence.encode('utf-8')).hexdigest()
        if h not in seen:
            seen.add(h)
            unique.append(sentence)
        else:
            removed += 1

    print(f'[DEDUP] {len(sentences)} → {len(unique)} sentences ({removed} duplicates removed)')
    return unique


def quality_score(sentence: str) -> float:
    """
    Score a sentence from 0.0 (worst) to 1.0 (best).

    Features:
    - Length score       (weight: 0.25)
    - Stopword ratio     (weight: 0.25)
    - Lexical diversity  (weight: 0.25)
    - Repetition penalty (weight: -0.20)
    - Avg word length    (weight: 0.05)
    """
    words = sentence.split()
    if not words:
        return 0.0

    length_score = min(len(words) / 30, 1.0)

    sw_count = sum(1 for w in words if w.lower() in STOPWORDS)
    sw_ratio = sw_count / len(words)

    lex_div = len(set(words)) / len(words)

    # Measure actual redundancy: fraction of words that are "extras" beyond
    # the first occurrence of each type.  Old formula counted distinct types
    # that repeat (e.g. 1/12 for "the the the the the…") which paradoxically
    # gave MORE repetitive text a LOWER penalty when the denominator grew.
    rep_penalty = (len(words) - len(set(words))) / len(words)

    avg_wl = sum(len(w) for w in words) / len(words)
    wl_score = min(avg_wl / 6, 1.0)

    score = (0.25 * length_score
           + 0.25 * sw_ratio
           + 0.25 * lex_div
           - 0.20 * rep_penalty
           + 0.05 * wl_score)

    return max(0.0, min(1.0, score))


def filter_by_quality(sentences: list, threshold: float = 0.50) -> list:
    """Keep only sentences with quality score above threshold."""
    kept = [s for s in sentences if quality_score(s) >= threshold]
    removed = len(sentences) - len(kept)
    print(f'[QUALITY] {len(sentences)} → {len(kept)} sentences ({removed} below threshold {threshold})')
    return kept
