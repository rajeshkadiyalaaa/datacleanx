import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import {
  Download, RotateCcw, CheckCircle, Copy, FileText,
  TrendingDown, TrendingUp, Layers, Hash,
} from 'lucide-react'
import { CleanResult } from '../types'

interface Props {
  result: CleanResult
  onReset: () => void
}

// Color palettes for charts
const SCORE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#6366f1', '#8b5cf6',
]
const PIE_COLORS = ['#6366f1', '#ef4444']

function getGrade(avgScore: number, retainedPct: number): { grade: string; color: string; label: string } {
  const composite = avgScore * 70 + (retainedPct / 100) * 30
  if (composite >= 60) return { grade: 'A', color: 'text-emerald-400', label: 'Excellent' }
  if (composite >= 45) return { grade: 'B', color: 'text-indigo-400', label: 'Good' }
  if (composite >= 30) return { grade: 'C', color: 'text-amber-400', label: 'Fair' }
  return { grade: 'D', color: 'text-red-400', label: 'Review' }
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Custom tooltip for bar charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        <p className="text-slate-100 font-semibold">{payload[0].value.toLocaleString()} {payload[0].name}</p>
      </div>
    )
  }
  return null
}

// Quality Score Gauge (SVG circle)
function QualityGauge({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(score, 0), 1)
  const offset = circumference * (1 - pct)
  const color = pct >= 0.7 ? '#10b981' : pct >= 0.5 ? '#6366f1' : pct >= 0.35 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold" style={{ color }}>{Math.round(pct * 100)}</span>
          <span className="text-slate-500 text-xs">/ 100</span>
        </div>
      </div>
      <p className="text-slate-400 text-xs font-medium">Avg Quality Score</p>
    </div>
  )
}

export default function ResultsDashboard({ result, onReset }: Props) {
  const [copied, setCopied] = useState(false)
  const { stats, pipeline_stages, score_distribution, noise_retained, token_comparison, cleaned_sentences } = result
  const { grade, color: gradeColor, label: gradeLabel } = getGrade(stats.avg_quality_score, stats.retained_pct)

  const copyAll = () => {
    navigator.clipboard.writeText(cleaned_sentences.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-20 border-t border-slate-800/50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display font-bold text-3xl text-slate-100 mb-1">Cleaning Results</h2>
            <p className="text-slate-500 text-sm">
              Processed {stats.file_names.length} file{stats.file_names.length !== 1 ? 's' : ''}:{' '}
              {stats.file_names.map((n, i) => (
                <span key={n} className="text-indigo-400">{n}{i < stats.file_names.length - 1 ? ', ' : ''}</span>
              ))}
            </p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Clean More Files
          </button>
        </div>

        {/* ── Row 1: Grade + Stats Cards ─────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

          {/* Grade Card */}
          <div className="col-span-2 lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow flex flex-col items-center justify-center gap-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Clean Grade</p>
            <span className={`font-display text-7xl font-extrabold leading-none ${gradeColor}`}>{grade}</span>
            <span className={`text-sm font-semibold ${gradeColor}`}>{gradeLabel}</span>
          </div>

          {/* Sentences cleaned */}
          <StatCard
            icon={Layers}
            value={stats.sentences_final.toLocaleString()}
            label="Clean Sentences"
            sub={`from ${stats.sentences_original.toLocaleString()} original`}
            color="indigo"
          />
          {/* Noise removed */}
          <StatCard
            icon={TrendingDown}
            value={`${stats.removed_pct}%`}
            label="Noise Removed"
            sub={`${stats.duplicates_removed} duplicates caught`}
            color="red"
          />
          {/* Data retained */}
          <StatCard
            icon={TrendingUp}
            value={`${stats.retained_pct}%`}
            label="Data Retained"
            sub="quality content kept"
            color="emerald"
          />
          {/* Tokens saved */}
          <StatCard
            icon={Hash}
            value={`${stats.noise_tokens_removed_pct}%`}
            label="Tokens Saved"
            sub={`${stats.tokens_after.toLocaleString()} / ${stats.tokens_before.toLocaleString()} tokens`}
            color="violet"
          />
        </div>

        {/* ── Row 2: Quality Gauge + Pipeline + Pie ──────────────── */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">

          {/* Quality Gauge */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow flex flex-col items-center justify-center gap-4">
            <h3 className="text-slate-400 text-sm font-semibold">Data Quality Score</h3>
            <QualityGauge score={stats.avg_quality_score} />
            <div className="w-full grid grid-cols-3 gap-2 text-center mt-1">
              {[
                { label: 'Threshold', val: stats.quality_threshold.toFixed(2) },
                { label: 'Avg Score', val: stats.avg_quality_score.toFixed(2) },
                { label: 'Docs', val: stats.documents_loaded },
              ].map(({ label, val }) => (
                <div key={label} className="px-2 py-1.5 rounded-lg bg-slate-800/60">
                  <p className="text-slate-100 text-sm font-bold">{val}</p>
                  <p className="text-slate-600 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Funnel */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow">
            <h3 className="text-slate-400 text-sm font-semibold mb-4">Pipeline Funnel</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipeline_stages} barCategoryGap="30%">
                <XAxis dataKey="stage" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="sentences" name="sentences" radius={[6, 6, 0, 0]}>
                  {pipeline_stages.map((_, i) => (
                    <Cell key={i} fill={['#6366f1', '#8b5cf6', '#10b981'][i] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Noise vs Retained Pie */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow">
            <h3 className="text-slate-400 text-sm font-semibold mb-4">Noise vs Retained</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={noise_retained}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {noise_retained.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                />
                <Tooltip
                  formatter={(val) => [`${val} sentences`, '']}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row 3: Score Distribution + Token Comparison ─────────── */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Score Distribution */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow">
            <h3 className="text-slate-400 text-sm font-semibold mb-1">Quality Score Distribution</h3>
            <p className="text-slate-600 text-xs mb-4">How sentences scored before filtering (0 = worst, 1 = best)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={score_distribution} barCategoryGap="10%">
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="count" name="sentences" radius={[4, 4, 0, 0]}>
                  {score_distribution.map((_, i) => (
                    <Cell key={i} fill={SCORE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e, #6366f1)' }} />
              <div className="flex justify-between w-full text-slate-600 text-xs absolute pointer-events-none" style={{ marginTop: 20 }}>
              </div>
            </div>
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>Low quality</span>
              <span>High quality</span>
            </div>
          </div>

          {/* Token Comparison */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow">
            <h3 className="text-slate-400 text-sm font-semibold mb-1">Token Count: Before vs After</h3>
            <p className="text-slate-600 text-xs mb-4">
              Noise tokens removed: <span className="text-red-400 font-semibold">{stats.noise_tokens_removed_pct}%</span>
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={token_comparison} barCategoryGap="40%">
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="tokens" name="tokens" radius={[8, 8, 0, 0]}>
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-500/20 text-center">
                <p className="text-amber-400 font-bold text-lg">{stats.tokens_before.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">Tokens Before</p>
              </div>
              <div className="px-3 py-2 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-center">
                <p className="text-emerald-400 font-bold text-lg">{stats.tokens_after.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">Tokens After</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 4: Cleaned Sentences + Download ──────────────────── */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 card-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-slate-200 font-semibold text-base">
                Cleaned Sentences
                <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-mono">{cleaned_sentences.length}</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">High-quality sentences ready for AI training</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
              <button
                onClick={() => downloadJSON(cleaned_sentences, 'cleaned_data.json')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                cleaned_data.json
              </button>
              <button
                onClick={() => downloadJSON(result.stats, 'stats.json')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                stats.json
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {cleaned_sentences.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 hover:bg-slate-800/80 transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-3 h-3 text-indigo-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-mono">{s}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(s)}
                  className="opacity-0 group-hover:opacity-100 ml-auto flex-shrink-0 text-slate-600 hover:text-slate-400 transition-all p-1"
                  title="Copy sentence"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

// ── Stat Card sub-component ───────────────────────────────────────────────────
const colorStyles: Record<string, { border: string; icon: string; value: string }> = {
  indigo: { border: 'border-indigo-500/20', icon: 'bg-indigo-500/15 text-indigo-400', value: 'text-indigo-300' },
  red: { border: 'border-red-500/20', icon: 'bg-red-500/15 text-red-400', value: 'text-red-300' },
  emerald: { border: 'border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-400', value: 'text-emerald-300' },
  violet: { border: 'border-violet-500/20', icon: 'bg-violet-500/15 text-violet-400', value: 'text-violet-300' },
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  color,
}: {
  icon: React.ElementType
  value: string | number
  label: string
  sub: string
  color: string
}) {
  const styles = colorStyles[color] ?? colorStyles.indigo
  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 border card-glow ${styles.border}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${styles.icon}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className={`font-display font-bold text-2xl mb-0.5 ${styles.value}`}>{value}</p>
      <p className="text-slate-300 text-sm font-medium">{label}</p>
      <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
    </div>
  )
}
