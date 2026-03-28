# tests/test_utils.py — Unit tests for utils.py
# Tests every public function: clean_text, is_good_line,
# deduplicate, quality_score, filter_by_quality.

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import clean_text, is_good_line, deduplicate, quality_score, filter_by_quality

# ─────────────────────────────────────────────────────────────────────────────
# clean_text
# ─────────────────────────────────────────────────────────────────────────────

class TestCleanText(unittest.TestCase):

    def test_removes_html_tags(self):
        raw = '<h1>Hello World</h1><p>Some content</p>'
        result = clean_text(raw)
        self.assertNotIn('<h1>', result)
        self.assertNotIn('<p>', result)
        self.assertIn('hello world', result)

    def test_removes_urls(self):
        raw = 'Visit https://example.com for more info about www.spam.org today'
        result = clean_text(raw)
        self.assertNotIn('https', result)
        self.assertNotIn('www.spam', result)

    def test_removes_email(self):
        raw = 'Contact support@example.com for assistance'
        result = clean_text(raw)
        self.assertNotIn('@', result)

    def test_normalizes_whitespace(self):
        raw = 'Too   many    spaces    here'
        result = clean_text(raw)
        self.assertEqual(result, 'too many spaces here')

    def test_lowercases(self):
        raw = 'MACHINE LEARNING Is GREAT'
        result = clean_text(raw)
        self.assertEqual(result, result.lower())

    def test_ampersand_stripped(self):
        """& is not in the allowed charset — 'R&D' becomes 'R D'."""
        raw = 'R&D investment in AI and ML'
        result = clean_text(raw)
        self.assertNotIn('&', result)
        self.assertIn('r', result)
        self.assertIn('d', result)

    def test_percent_stripped(self):
        """% is not in the allowed charset — '99%' becomes '99 '."""
        raw = 'accuracy of 99% was achieved'
        result = clean_text(raw)
        self.assertNotIn('%', result)

    def test_non_ascii_stripped(self):
        raw = 'Café au lait résumé naïve'
        result = clean_text(raw)
        self.assertTrue(result.isascii())

    def test_empty_string(self):
        self.assertEqual(clean_text(''), '')

    def test_only_html(self):
        result = clean_text('<html><body><nav>menu</nav></body></html>')
        self.assertIn('menu', result)


# ─────────────────────────────────────────────────────────────────────────────
# is_good_line
# ─────────────────────────────────────────────────────────────────────────────

class TestIsGoodLine(unittest.TestCase):

    def test_rejects_too_few_words(self):
        self.assertFalse(is_good_line('hello world', min_words=5))

    def test_accepts_enough_words(self):
        self.assertTrue(is_good_line('machine learning is a subset of artificial intelligence'))

    def test_rejects_too_long(self):
        self.assertFalse(is_good_line('word ' * 450))

    def test_rejects_high_digit_ratio(self):
        self.assertFalse(is_good_line('12345 67890 12345 67890 12345'))

    def test_rejects_word_repetition_spam(self):
        # 'buy' is 5/7 ≈ 71% > 30%, and top_count > 1
        self.assertFalse(is_good_line('buy buy buy buy buy now offer'))

    def test_rejects_low_alpha_ratio(self):
        # digits dominate; alpha ratio < 60%
        self.assertFalse(is_good_line('123 456 789 abc def'))

    def test_short_word_alpha_ratio(self):
        """Lines of short (1-2 char) words should still pass because spaces
        don't push the alpha ratio below 0.60 for typical natural language."""
        line = 'i am a big fan of ai today'
        ratio = sum(1 for c in line if c.isalpha()) / len(line)
        self.assertGreater(ratio, 0.60)
        self.assertTrue(is_good_line(line))

    def test_custom_min_words(self):
        """3-word line with all-unique words must pass min_words=3 after
        the top_count > 1 guard fix (1/3 = 0.33 > 0.30 was a false reject)."""
        line = 'hello world foo'
        self.assertTrue(is_good_line(line, min_words=3),
                        msg='3-word all-unique line should pass min_words=3')
        self.assertFalse(is_good_line(line, min_words=4))


# ─────────────────────────────────────────────────────────────────────────────
# deduplicate
# ─────────────────────────────────────────────────────────────────────────────

class TestDeduplicate(unittest.TestCase):

    def test_removes_exact_duplicates(self):
        result = deduplicate(['hello world', 'foo bar baz', 'hello world', 'unique one'])
        self.assertEqual(len(result), 3)
        self.assertEqual(result.count('hello world'), 1)

    def test_preserves_first_occurrence_order(self):
        result = deduplicate(['first', 'second', 'first', 'third'])
        self.assertEqual(result, ['first', 'second', 'third'])

    def test_empty_list(self):
        self.assertEqual(deduplicate([]), [])

    def test_no_duplicates_unchanged(self):
        sentences = ['alpha', 'beta', 'gamma']
        self.assertEqual(deduplicate(sentences), sentences)

    def test_case_sensitive(self):
        """'Hello' and 'hello' are different hashes — both must be kept."""
        result = deduplicate(['Hello world', 'hello world'])
        self.assertEqual(len(result), 2)

    def test_all_identical(self):
        result = deduplicate(['same sentence'] * 5)
        self.assertEqual(len(result), 1)


# ─────────────────────────────────────────────────────────────────────────────
# quality_score
# ─────────────────────────────────────────────────────────────────────────────

class TestQualityScore(unittest.TestCase):

    def test_empty_string_returns_zero(self):
        self.assertEqual(quality_score(''), 0.0)

    def test_score_in_valid_range(self):
        sentences = [
            'machine learning is a subset of artificial intelligence',
            'the cat sat on the mat looking at the moon',
            'hello',
            'a b c d e f g h i j k l m',
            'deep learning uses multiple layers of neural networks to model complex patterns',
        ]
        for s in sentences:
            score = quality_score(s)
            self.assertGreaterEqual(score, 0.0, msg=f'Score < 0 for: {s}')
            self.assertLessEqual(score, 1.0, msg=f'Score > 1 for: {s}')

    def test_theoretical_maximum(self):
        """The formula maximum is ~0.80 (length+sw+lex+wl weights with rep=0).
        The docstring claims 1.0 as max, but that is unreachable."""
        best = ' '.join(['information', 'knowledge', 'understanding', 'intelligence',
                         'learning', 'processing', 'generation', 'classification',
                         'regression', 'clustering', 'optimization', 'architecture',
                         'transformer', 'attention', 'embeddings', 'tokenization',
                         'pretraining', 'finetuning', 'evaluation', 'benchmark',
                         'performance', 'accuracy', 'precision', 'generalization',
                         'regularization', 'backpropagation', 'gradient', 'convergence',
                         'inference', 'prediction'])
        score = quality_score(best)
        self.assertLessEqual(score, 1.0)
        self.assertLessEqual(score, 0.82, msg=f'Score {score} exceeds theoretical max ~0.80')

    def test_single_word_scores_below_threshold(self):
        score = quality_score('hello')
        self.assertGreaterEqual(score, 0.0)
        self.assertLess(score, 0.5)

    def test_highly_repetitive_is_lower(self):
        """rep_penalty = (total_words - unique_words) / total_words ensures
        more repetitive text always scores lower."""
        normal = 'the quick brown fox jumps over the lazy dog today'
        repetitive = 'the the the the the fox jumps over the lazy dog today'
        self.assertLess(quality_score(repetitive), quality_score(normal),
                        msg='Repetitive text should score lower than normal text')


# ─────────────────────────────────────────────────────────────────────────────
# filter_by_quality
# ─────────────────────────────────────────────────────────────────────────────

class TestFilterByQuality(unittest.TestCase):

    def test_empty_list_returns_empty(self):
        self.assertEqual(filter_by_quality([], threshold=0.5), [])

    def test_keeps_high_quality_removes_low(self):
        # 26-word sentence richly scored above 0.5; 'buy' single word scores ~0
        high = ('machine learning is a subfield of artificial intelligence that uses '
                'statistical techniques to give computer systems the ability to learn '
                'from data without being explicitly programmed')
        low = 'buy'
        result = filter_by_quality([high, low], threshold=0.5)
        self.assertIn(high, result)
        self.assertNotIn(low, result)

    def test_boundary_threshold_inclusive(self):
        """Sentence with score == threshold must be KEPT (>= not >)."""
        sentences = [
            'machine learning enables computers to learn from data',
            'the cat is on the mat',
            'deep neural networks can approximate complex functions',
        ]
        for s in sentences:
            sc = quality_score(s)
            result = filter_by_quality([s], threshold=sc)
            self.assertIn(s, result, msg=f'score={sc} at exact threshold should be kept')

    def test_threshold_zero_keeps_all(self):
        sentences = ['hello world', 'test data', 'something here']
        self.assertEqual(len(filter_by_quality(sentences, threshold=0.0)), len(sentences))

    def test_threshold_one_keeps_none(self):
        """No sentence can realistically score 1.0 (actual max ~0.80)."""
        sentences = ['machine learning is a subset of artificial intelligence', 'hello world']
        result = filter_by_quality(sentences, threshold=1.0)
        self.assertEqual(len(result), 0, msg='No sentence should score exactly 1.0')


if __name__ == '__main__':
    unittest.main(verbosity=2)
