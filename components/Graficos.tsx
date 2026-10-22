"use client"
import { Chart as C, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
C.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend)

const VERDES = ["#0B7A3B", "#22A04B", "#6CC08A", "#0B5E31", "#A7D8B7", "#E03A2F", "#33414F"]

export function Barras({ labels, series }: { labels: string[]; series: { label: string; data: number[]; color?: string }[] }) {
  return (
    <div className="h-64">
      <Bar
        data={{ labels, datasets: series.map((s, i) => ({ label: s.label, data: s.data, backgroundColor: s.color ?? VERDES[i % VERDES.length], borderRadius: 6 })) }}
        options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true } } }}
      />
    </div>
  )
}

export function Torta({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <div className="h-64">
      <Doughnut data={{ labels, datasets: [{ data, backgroundColor: VERDES }] }} options={{ maintainAspectRatio: false, plugins: { legend: { position: "right" } } }} />
    </div>
  )
}
