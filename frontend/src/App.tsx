import { useState, useRef } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import UploadSection from './components/UploadSection'
import SampleGuide from './components/SampleGuide'
import ResultsDashboard from './components/ResultsDashboard'
import { CleanResult } from './types'

export default function App() {
  const [result, setResult] = useState<CleanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const uploadRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleResult = (data: CleanResult) => {
    setResult(data)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-[#050b18]">
      <Navbar onStartClick={scrollToUpload} />
      <HeroSection onStartClick={scrollToUpload} />

      <div ref={uploadRef}>
        <UploadSection
          onResult={handleResult}
          loading={loading}
          setLoading={setLoading}
        />
      </div>

      {!result && <SampleGuide />}

      {result && (
        <div ref={resultsRef}>
          <ResultsDashboard result={result} onReset={() => setResult(null)} />
        </div>
      )}

      <footer className="border-t border-slate-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">
            <span className="text-gradient font-semibold">DataCleanX</span> — Powered by FLUX Methodology
          </p>
          <p className="text-slate-600 text-xs">
            Inspired by the FLUX Data Curation Research Paper
          </p>
        </div>
      </footer>
    </div>
  )
}
