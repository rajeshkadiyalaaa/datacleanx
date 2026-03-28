import { ArrowRight, ChevronRight, Shield, Zap, BarChart3 } from 'lucide-react'

interface Props {
  onStartClick: () => void
}

const PIPELINE_STEPS = ['Raw Text', 'Clean', 'Filter', 'Dedup', 'Score', 'Output']

const FEATURES = [
  { icon: Zap, label: 'Line-Level Precision', desc: 'Only bad lines removed, not entire documents' },
  { icon: Shield, label: 'Deduplication', desc: 'SHA-256 hash-based exact duplicate removal' },
  { icon: BarChart3, label: 'Quality Scoring', desc: '5-feature sentence quality scoring system' },
]

export default function HeroSection({ onStartClick }: Props) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          Inspired by FLUX Data Curation Research
        </div>

        {/* Title */}
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 animate-slide-up">
          <span className="text-gradient">DataCleanX</span>
          <br />
          <span className="text-slate-200 text-4xl sm:text-5xl lg:text-6xl font-bold">
            FLUX-Based Data Cleaning
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Transform noisy, messy raw text into{' '}
          <span className="text-indigo-300 font-medium">high-quality AI training data</span>{' '}
          using the FLUX line-level cleaning methodology. Upload · Clean · Download.
        </p>

        {/* Pipeline visual */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap mb-12">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1 sm:gap-2">
              <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-300 text-xs sm:text-sm font-medium whitespace-nowrap hover:border-indigo-500/40 hover:text-indigo-300 transition-colors">
                {step}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStartClick}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 mb-16"
        >
          Start Cleaning Your Data
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 card-glow hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center mb-3">
                <Icon className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-200 text-sm mb-1">{label}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* FLUX Innovation callout */}
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-indigo-900/20 to-violet-900/20 border border-indigo-500/20 text-left">
          <h3 className="font-display font-bold text-indigo-300 text-base mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center text-xs">★</span>
            The FLUX Innovation: Line-Level vs Document-Level Filtering
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
              <p className="text-red-400 font-semibold mb-1">❌ Old Approach (Document-Level)</p>
              <p className="text-slate-400 text-xs">1 bad line → delete entire document → <span className="text-red-400 font-medium">60–80% data loss</span></p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
              <p className="text-emerald-400 font-semibold mb-1">✅ FLUX Approach (Line-Level)</p>
              <p className="text-slate-400 text-xs">1 bad line → delete only that line → <span className="text-emerald-400 font-medium">20–30% data loss</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
