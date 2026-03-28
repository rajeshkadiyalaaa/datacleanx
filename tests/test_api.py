# tests/test_api.py — End-to-end tests for backend/app.py Flask API
# Uses the Flask test client to simulate real HTTP requests.

import sys
import os
import io
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

from backend.app import app

SAMPLE_CLEAN_TEXT = (
    'Natural language processing is a subfield of artificial intelligence.\n'
    'It focuses on the interaction between computers and human language.\n'
    'Transformer models have significantly improved NLP benchmarks worldwide.\n'
    'Pre-training on large corpora enables models to learn general language representations.\n'
    'Fine-tuning allows these models to be adapted for specific downstream tasks.'
)

# Spam lines are kept short (< 5 words after cleaning) so they reliably fail
# the min_words filter in is_good_line, giving the test a clear pass criterion.
SPAM_TEXT = (
    'BUY NOW!\n'                  # 2 words → fails min_words=5
    '!!!\n'                       # 1 token → fails
    'HOME ABOUT CONTACT\n'        # 3 words → fails
    '!!!\n'                       # fails
    'Machine learning is transforming how we analyze and interpret large datasets.\n'
)


class TestHealthEndpoint(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()

    def test_health_returns_200(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)

    def test_health_returns_correct_json(self):
        data = self.client.get('/api/health').get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['service'], 'DataCleanX API')


class TestCleanEndpoint(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()

    def _upload(self, content: str, filename: str = 'test.txt',
                threshold: float = 0.5, min_words: int = 5):
        file_data = io.BytesIO(content.encode('utf-8'))
        data = {
            'files': (file_data, filename),
            'threshold': str(threshold),
            'min_words': str(min_words),
        }
        return self.client.post('/api/clean', data=data, content_type='multipart/form-data')

    def test_clean_returns_200_for_valid_file(self):
        self.assertEqual(self._upload(SAMPLE_CLEAN_TEXT).status_code, 200)

    def test_clean_response_has_all_top_level_keys(self):
        """Response must contain all keys the frontend expects."""
        data = self._upload(SAMPLE_CLEAN_TEXT).get_json()
        for key in ['stats', 'pipeline_stages', 'score_distribution',
                    'noise_retained', 'token_comparison', 'cleaned_sentences']:
            self.assertIn(key, data, msg=f'Missing top-level key: {key}')

    def test_clean_stats_has_all_required_subkeys(self):
        """stats sub-object must have all keys the frontend uses."""
        stats = self._upload(SAMPLE_CLEAN_TEXT).get_json()['stats']
        for key in ['documents_loaded', 'documents_after_clean',
                    'sentences_original', 'sentences_after_dedup', 'duplicates_removed',
                    'sentences_final', 'removed_pct', 'retained_pct',
                    'tokens_before', 'tokens_after', 'noise_tokens_removed_pct',
                    'avg_quality_score', 'quality_threshold', 'file_names']:
            self.assertIn(key, stats, msg=f'Missing stats key: {key}')

    def test_clean_removes_spam_lines(self):
        data = self._upload(SPAM_TEXT).get_json()
        cleaned = data['cleaned_sentences']
        for sentence in cleaned:
            self.assertNotIn('buy now', sentence.lower())
            self.assertNotIn('home about contact', sentence.lower())

    def test_clean_no_files_returns_400(self):
        response = self.client.post('/api/clean', data={}, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)

    def test_clean_non_txt_file_returns_400(self):
        data = {'files': (io.BytesIO(b'content'), 'document.pdf')}
        response = self.client.post('/api/clean', data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)

    def test_clean_custom_threshold_affects_output(self):
        """Higher threshold should produce fewer or equal sentences."""
        lenient = self._upload(SAMPLE_CLEAN_TEXT, threshold=0.2).get_json()['stats']['sentences_final']
        strict = self._upload(SAMPLE_CLEAN_TEXT, threshold=0.8).get_json()['stats']['sentences_final']
        self.assertGreaterEqual(lenient, strict,
                                msg='Lenient threshold should keep >= sentences than strict')

    def test_clean_pipeline_stages_structure(self):
        """pipeline_stages must have 3 entries with 'stage' and 'sentences' keys."""
        stages = self._upload(SAMPLE_CLEAN_TEXT).get_json()['pipeline_stages']
        self.assertEqual(len(stages), 3)
        for stage in stages:
            self.assertIn('stage', stage)
            self.assertIn('sentences', stage)

    def test_clean_score_distribution_has_10_buckets(self):
        """score_distribution must have exactly 10 buckets covering 0.0–1.0."""
        dist = self._upload(SAMPLE_CLEAN_TEXT).get_json()['score_distribution']
        self.assertEqual(len(dist), 10)
        for item in dist:
            self.assertIn('range', item)
            self.assertIn('count', item)

    def test_clean_multiple_files(self):
        f1 = io.BytesIO(SAMPLE_CLEAN_TEXT.encode('utf-8'))
        f2 = io.BytesIO(SPAM_TEXT.encode('utf-8'))
        data = {
            'files': [(f1, 'file1.txt'), (f2, 'file2.txt')],
            'threshold': '0.5',
            'min_words': '5',
        }
        result = self.client.post('/api/clean', data=data, content_type='multipart/form-data').get_json()
        self.assertEqual(result['stats']['documents_loaded'], 2)

    def test_retained_plus_removed_math(self):
        """retained_pct + removed_pct must round-trip correctly."""
        stats = self._upload(SAMPLE_CLEAN_TEXT).get_json()['stats']
        original = stats['sentences_original']
        final = stats['sentences_final']
        expected_removed_pct = round((original - final) / max(original, 1) * 100, 1)
        self.assertEqual(stats['removed_pct'], expected_removed_pct)


if __name__ == '__main__':
    unittest.main(verbosity=2)
