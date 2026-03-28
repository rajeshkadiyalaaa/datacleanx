export interface Stats {
  documents_loaded: number
  documents_after_clean: number
  sentences_original: number
  sentences_after_dedup: number
  duplicates_removed: number
  sentences_final: number
  removed_pct: number
  retained_pct: number
  tokens_before: number
  tokens_after: number
  noise_tokens_removed_pct: number
  avg_quality_score: number
  quality_threshold: number
  file_names: string[]
}

export interface PipelineStage {
  stage: string
  sentences: number
}

export interface ScoreDistItem {
  range: string
  count: number
}

export interface NoiseRetainedItem {
  name: string
  value: number
}

export interface TokenComparisonItem {
  name: string
  tokens: number
}

export interface CleanResult {
  stats: Stats
  pipeline_stages: PipelineStage[]
  score_distribution: ScoreDistItem[]
  noise_retained: NoiseRetainedItem[]
  token_comparison: TokenComparisonItem[]
  cleaned_sentences: string[]
}
