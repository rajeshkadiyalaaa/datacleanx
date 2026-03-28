import { Zap } from 'lucide-react'

interface Props {
  onStartClick: () => void
}

export default function Navbar({ onStartClick }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-[#050b18]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-gradient">
            DataCleanX
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Zap className="w-3 h-3" />
            FLUX Powered
          </span>
          <button
            onClick={onStartClick}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25"
          >
            Start Cleaning
          </button>
        </div>
      </div>
    </nav>
  )
}
