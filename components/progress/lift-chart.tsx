'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Props = { data: { date: string; rm: number }[]; label: string }

export function LiftChart({ data, label }: Props) {
  const latest = data[data.length - 1]?.rm
  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      {data.length === 0 ? (
        <p className="text-gray-600 text-sm mt-1">Нет данных — выполни AMRAP сет</p>
      ) : (
        <>
          <p className="text-white text-2xl font-bold mb-3">{latest} кг</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} width={35} />
              <Tooltip
                contentStyle={{ background: '#111827', border: 'none', borderRadius: 8 }}
                formatter={(v) => [`${v ?? ''} кг`, '1RM']}
              />
              <Line type="monotone" dataKey="rm" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
