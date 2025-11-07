export function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Seu Progresso Geral</h2>
        <span className="text-2xl font-bold text-purple-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Continue aprendendo para aumentar seu progresso!
      </p>
    </div>
  )
}

