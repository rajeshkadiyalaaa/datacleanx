import { FileText, Globe, MessageSquare, BookOpen, CheckCircle, XCircle } from 'lucide-react'

const FILE_TYPES = [
  {
    icon: Globe,
    title: 'Web Articles / HTML Pages',
    desc: 'Scraped web content, blog posts, news articles saved as .txt',
    good: ['Main article paragraphs', 'Section headings with substance', 'Author bylines with context'],
    bad: ['<html>, <nav>, <meta> tags', 'Cookie banners & popups', 'Navigation menus'],
    color: 'blue',
  },
  {
    icon: MessageSquare,
    title: 'Forum Posts & Reddit Threads',
    desc: 'Community discussions, Q&A threads, comment sections',
    good: ['Detailed technical answers', 'Multi-sentence explanations', 'Educational replies'],
    bad: ['Upvote counts & timestamps', 'One-word replies ("lol", "+1")', 'Sort/filter UI text'],
    color: 'violet',
  },
  {
    icon: Globe,
    title: 'Wikipedia / Encyclopedia',
    desc: 'Knowledge base articles, reference pages, textbook excerpts',
    good: ['Definition paragraphs', 'Historical context sections', 'Technical explanations'],
    bad: ['Table of Contents lines', 'Category tags & navboxes', '"[edit]" and "[hide]" links'],
    color: 'emerald',
  },
  {
    icon: BookOpen,
    title: 'Research Papers & Reports',
    desc: 'Academic papers, technical reports, scientific documents',
    good: ['Abstract & introduction', 'Methodology descriptions', 'Results & conclusions'],
    bad: ['Keywords lists (short)', 'Reference/citation lines', 'Figure/table captions'],
    color: 'amber',
  },
]

const BEFORE_AFTER = [
  { text: 'Climate change is one of the most pressing challenges facing humanity.', keep: true },
  { text: 'BUY NOW!!! LIMITED OFFER $$$', keep: false },
  { text: 'Scientists predict further warming by 2100 due to rising CO2 levels.', keep: true },
  { text: '!!!', keep: false },
  { text: 'Renewable energy is critical to reducing greenhouse gas emissions.', keep: true },
  { text: 'Visit www.spam.com for special offers today.', keep: false },
]

const colorMap: Record<string, string> = {
  blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
  violet: 'border-violet-500/20 bg-violet-500/5 text-violet-400',
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
}

export default function SampleGuide() {
  return (
    <section className="py-20 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-3">
            What Files Can You Upload?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            DataCleanX works best with raw, real-world text. Here's what to expect for each type.
          </p>
        </div>

        {/* File type grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-16">
          {FILE_TYPES.map(({ icon: Icon, title, desc, good, bad, color }) => (
            <div key={title} className={`p-6 rounded-2xl border bg-slate-900/40 transition-all duration-300 hover:-translate-y-0.5 card-glow-hover ${colorMap[color].split(' ').slice(0, 2).join(' ')}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-base mb-0.5">{title}</h3>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> FLUX Keeps
                  </p>
                  <ul className="space-y-1">
                    {good.map(g => (
                      <li key={g} className="text-slate-400 text-xs flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">›</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> FLUX Removes
                  </p>
                  <ul className="space-y-1">
                    {bad.map(b => (
                      <li key={b} className="text-slate-500 text-xs flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5 flex-shrink-0">›</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Before / After example */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="font-display font-bold text-xl text-slate-200 mb-6 text-center">
            Live Example: Before vs After FLUX Cleaning
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <p className="text-red-400 text-sm font-semibold">Before — Raw Input</p>
              </div>
              <div className="space-y-2">
                {BEFORE_AFTER.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-mono ${item.keep
                      ? 'bg-slate-800/60 text-slate-300'
                      : 'bg-red-900/20 border border-red-500/20 text-red-400'
                    }`}
                  >
                    <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className={item.keep ? '' : 'line-through opacity-60'}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-emerald-400 text-sm font-semibold">After — FLUX Cleaned</p>
              </div>
              <div className="space-y-2">
                {BEFORE_AFTER.filter(i => i.keep).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-mono bg-emerald-900/15 border border-emerald-500/20 text-emerald-300"
                  >
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                    {item.text}
                  </div>
                ))}
                <div className="mt-3 p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/20">
                  <p className="text-indigo-400 text-xs font-medium">
                    ✓ 3 spam/noise lines removed · 3 clean sentences retained · 0% data loss from good content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
