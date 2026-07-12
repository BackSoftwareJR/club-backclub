import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { formatCurrency } from '@/lib/utils'
import type { AdminAnalyticsResponse } from '@/types'

interface AdminAnalyticsDashboardProps {
  analytics: AdminAnalyticsResponse
}

const pieColors = ['#D4AF37', '#B08D2B', '#8A6D1C', '#665013', '#40310A']

function formatCompactDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
}

export function AdminAnalyticsDashboard({ analytics }: AdminAnalyticsDashboardProps) {
  const trendData = analytics.cassa_trend.map((point) => ({
    date: point.date,
    total: Number.parseFloat(point.cumulative_total),
    delta: Number.parseFloat(point.daily_delta),
  }))

  const donutData = analytics.top_consumed_products.map((product) => ({
    name: product.product_name,
    value: product.purchases_count,
    spend: Number.parseFloat(product.total_spent),
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Membri totali" value={String(analytics.member_vice_stats.total_members)} />
        <StatCard label="Spender attivi" value={String(analytics.member_vice_stats.active_spenders)} />
        <StatCard label="Acquisti registrati" value={String(analytics.member_vice_stats.total_purchases)} />
        <StatCard label="Membri low balance" value={String(analytics.member_vice_stats.low_balance_members)} />
        <StatCard label="Top spender" value={analytics.member_vice_stats.top_spender_email} />
        <StatCard label="Top spender totale" value={formatCurrency(analytics.member_vice_stats.top_spender_total)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassPanel className="space-y-4 p-4">
          <div>
            <h3 className="text-lg">Cassa risparmi - trend</h3>
            <p className="text-sm text-white/60">Andamento cumulativo degli ultimi 30 giorni.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={formatCompactDate} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(8,8,8,0.95)',
                  }}
                />
                <Line dataKey="total" dot={false} stroke="#D4AF37" strokeWidth={3} type="monotone" />
                <Line dataKey="delta" dot={false} stroke="#9CA3AF" strokeWidth={1.8} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 p-4">
          <div>
            <h3 className="text-lg">Top prodotti consumati</h3>
            <p className="text-sm text-white/60">Distribuzione per numero acquisti.</p>
          </div>
          {donutData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={donutData}
                    dataKey="value"
                    innerRadius={70}
                    nameKey="name"
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {donutData.map((_, index) => (
                      <Cell key={`pie-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(8,8,8,0.95)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Nessun acquisto registrato: il grafico apparira dopo le prime transazioni.
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel className="p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>
      <p className="mt-2 truncate text-2xl">{value}</p>
    </GlassPanel>
  )
}
