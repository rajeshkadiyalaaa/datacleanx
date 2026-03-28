# tests/test_pipeline.py — Integration tests for pipeline.py
# Tests the full end-to-end cleaning flow using run_pipeline()
# and the individual orchestration helpers.

import sys
import os
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pipeline import run_pipeline, clean_document_lines, split_into_sentences


class TestCleanDocumentLines(unittest.TestCase):

    def test_removes_spam_lines(self):
        doc = 'Machine learning is important for AI research.\nBUY NOW! HERE\nDeep learning uses neural networks.'
        result = clean_document_lines(doc, min_words=5)
        self.assertNotIn('buy', result)
        self.assertIn('machine learning', result)

    def test_removes_html_within_document(self):
        doc = '<html><head><title>Test</title></head>\nNeural networks learn from data in multiple layers.\n<footer>Copyright 2024</footer>'
        result = clean_document_lines(doc, min_words=5)
        self.assertNotIn('<html>', result)
        self.assertNotIn('<footer>', result)

    def test_preserves_good_lines(self):
        doc = ('Natural language processing enables machines to understand human language.\n'
               'Deep learning has revolutionized computer vision and speech recognition.')
        result = clean_document_lines(doc, min_words=5)
        self.assertIn('natural language processing', result)

    def test_returns_empty_for_all_bad_lines(self):
        doc = 'Buy!\nClick!\n!!!\nXXX'
        self.assertEqual(clean_document_lines(doc, min_words=5).strip(), '')


class TestSplitIntoSentences(unittest.TestCase):

    def test_splits_on_period(self):
        docs = ['First sentence. Second sentence. Third sentence.']
        result = split_into_sentences(docs)
        self.assertEqual(len(result), 3)

    def test_replaces_exclamation_and_question(self):
        docs = ['Is this working? Yes it is! Great result.']
        result = split_into_sentences(docs)
        self.assertGreaterEqual(len(result), 2)

    def test_empty_documents(self):
        self.assertEqual(split_into_sentences([]), [])

    def test_filters_empty_parts(self):
        docs = ['Hello... World... Test']
        result = split_into_sentences(docs)
        for s in result:
            self.assertNotEqual(s.strip(), '')


class TestRunPipeline(unittest.TestCase):

    def _make_temp_dir(self, files: dict) -> tuple:
        data_dir = tempfile.mkdtemp()
        out_dir = tempfile.mkdtemp()
        for name, content in files.items():
            with open(os.path.join(data_dir, name), 'w', encoding='utf-8') as f:
                f.write(content)
        return data_dir, out_dir

    def test_pipeline_returns_two_values(self):
        data_dir, out_dir = self._make_temp_dir({
            'clean.txt': ('Machine learning enables computers to learn from experience without explicit programming.\n'
                          'Deep learning is a subfield of machine learning using multi-layer neural networks.')
        })
        result = run_pipeline(data_dir=data_dir + '/', output_dir=out_dir + '/')
        self.assertIsNotNone(result)
        sentences, stats = result
        self.assertIsInstance(sentences, list)
        self.assertIsInstance(stats, dict)

    def test_pipeline_produces_output_files(self):
        data_dir, out_dir = self._make_temp_dir({
            'doc.txt': (
                'Natural language processing is a field of artificial intelligence.\n'
                'It enables computers to understand, interpret and generate human language.\n'
                'Applications include machine translation, sentiment analysis, and chatbots.\n'
                'The transformer architecture has revolutionized how we approach NLP tasks.'
            )
        })
        run_pipeline(data_dir=data_dir + '/', output_dir=out_dir + '/')
        self.assertTrue(os.path.exists(os.path.join(out_dir, 'cleaned_data.json')))
        self.assertTrue(os.path.exists(os.path.join(out_dir, 'stats.json')))

    def test_pipeline_stats_keys_present(self):
        data_dir, out_dir = self._make_temp_dir({
            'doc.txt': (
                'Supervised learning trains models on labeled datasets to make predictions.\n'
                'Unsupervised learning discovers hidden patterns in unlabeled data.\n'
                'Reinforcement learning trains agents through reward and penalty signals.'
            )
        })
        _, stats = run_pipeline(data_dir=data_dir + '/', output_dir=out_dir + '/')
        for key in ['documents_loaded', 'sentences_original', 'sentences_final',
                    'removed_pct', 'retained_pct', 'tokens_before', 'tokens_after',
                    'noise_tokens_removed_pct', 'quality_threshold']:
            self.assertIn(key, stats, msg=f'Missing stats key: {key}')

    def test_pipeline_deduplication_works(self):
        repeated = 'Machine learning is a powerful tool for data analysis and prediction.'
        data_dir, out_dir = self._make_temp_dir({
            'doc.txt': (repeated + '\n') * 5 +
                       'Natural language processing enables text understanding and generation.\n'
        })
        sentences, _ = run_pipeline(data_dir=data_dir + '/', output_dir=out_dir + '/')
        matches = [s for s in sentences if 'machine learning is a powerful tool' in s]
        self.assertLessEqual(len(matches), 1, msg='Duplicate sentence should have been deduplicated')

    def test_pipeline_empty_data_dir_returns_none(self):
        data_dir = tempfile.mkdtemp()
        out_dir = tempfile.mkdtemp()
        result = run_pipeline(data_dir=data_dir + '/', output_dir=out_dir + '/')
        self.assertIsNone(result)


if __name__ == '__main__':
    unittest.main(verbosity=2)
