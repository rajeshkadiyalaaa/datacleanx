import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle, Settings2 } from 'lucide-react'
import { CleanResult } from '../types'

interface Props {
  onResult: (data: CleanResult) => void
  loading: boolean
  setLoading: (v: boolean) => void
}

const LOAD_STEPS = [
  'Loading documents...',
  'Cleaning & filtering lines...',
  'Removing duplicates...',
  'Scoring sentence quality...',
  'Finalizing results...',
]

export default function UploadSection({ onResult, loading, setLoading }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [threshold, setThreshold] = useState(0.50)
  const [minWords, setMinWords] = useState(5)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    const txtFiles = accepted.filter(f => f.name.endsWith('.txt'))
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...txtFiles.filter(f => !existing.has(f.name))]
    })
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'] },
    multiple: true,
  })

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  const handleClean = async () => {
    if (!files.length) {
      setError('Please upload at least one .txt file.')
      return
    }
    setError(null)
    setLoading(true)
    setStep(0)

    const interval = setInterval(() => {
      setStep(prev => (prev < LOAD_STEPS.length - 1 ? prev + 1 : prev))
    }, 500)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      formData.append('threshold', String(threshold))
      formData.append('min_words', String(minWords))

      const { data } = await axios.post<CleanResult>('/api/clean', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      clearInterval(interval)
      setStep(LOAD_STEPS.length - 1)
      setTimeout(() => {
        setLoading(false)
        onResult(data)
      }, 600)
    } catch (err: unknown) {
      clearInterval(interval)
      setLoading(false)
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Server error'
        : 'Unexpected error'
      setError(msg)
    }
  }

  return (
    <section id="upload" className="py-20 relative">
      <div className="max-w-3xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-3">
            Upload Your Data Files
          </h2>
          <p className="text-slate-400">
            Drop any <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm">.txt</code> files — articles, forum posts, web scrapes, research papers, anything.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-4
            ${isDragActive
              ? 'border-indigo-500 bg-indigo-500/08'
              : 'border-slate-700 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/60'
            }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${isDragActive ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
              <Upload className={`w-7 h-7 transition-colors duration-200 ${isDragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
            </div>
            {isDragActive ? (
              <p className="text-indigo-400 font-semibold text-lg">Drop files here!</p>
            ) : (
              <>
                <div>
                  <p className="text-slate-200 font-semibold text-lg mb-1">
                    Drag & drop your .txt files
                  </p>
                  <p className="text-slate-500 text-sm">or click to browse your computer</p>
                </div>
                <p className="text-xs text-slate-600 bg-slate-800/60 px-3 py-1.5 rounded-lg">
                  Accepts .txt files only · Multiple files supported
                </p>
              </>
            )}
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 mb-6">
            {files.map(f => (
              <div
                key={f.name}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm font-medium truncate max-w-xs">{f.name}</span>
                  <span className="text-slate-600 text-xs">{(f.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-slate-400 text-sm font-semibold">Pipeline Settings</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-300 text-sm font-medium">Quality Threshold</label>
                <span className="text-indigo-400 font-mono text-sm font-bold">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.9}
                step={0.05}
                value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-slate-600 text-xs mt-1">
                <span>0.2 (lenient)</span>
                <span>0.9 (strict)</span>
              </div>
            </div>

            {/* Min words */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-300 text-sm font-medium">Min Words per Line</label>
                <span className="text-indigo-400 font-mono text-sm font-bold">{minWords}</span>
              </div>
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={minWords}
                onChange={e => setMinWords(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-slate-600 text-xs mt-1">
                <span>3 (more data)</span>
                <span>15 (stricter)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleClean}
          disabled={loading || !files.length}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/25 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {LOAD_STEPS[step]}
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Clean My Data
            </>
          )}
        </button>

        {/* Loading progress */}
        {loading && (
          <div className="mt-4 space-y-2">
            {LOAD_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                {i < step ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : i === step ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                )}
                <span className={i <= step ? 'text-slate-300' : 'text-slate-600'}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
