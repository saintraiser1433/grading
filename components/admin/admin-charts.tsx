"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Bar, BarChart } from "recharts"

interface AdminChartsProps {
  enrollmentData: Array<{ month: string; count: number }>
  submissionsData: {
    pending: number
    approved: number
    declined: number
  }
}

export function AdminCharts({ enrollmentData, submissionsData }: AdminChartsProps) {
  // Prepare data for enrollment chart
  const chartData = enrollmentData.length > 0 
    ? enrollmentData 
    : [
        { month: "Jan", count: 45 },
        { month: "Feb", count: 52 },
        { month: "Mar", count: 48 },
        { month: "Apr", count: 61 },
        { month: "May", count: 55 },
        { month: "Jun", count: 67 },
        { month: "Jul", count: 73 },
        { month: "Aug", count: 89 },
        { month: "Sep", count: 95 },
        { month: "Oct", count: 88 },
        { month: "Nov", count: 92 },
        { month: "Dec", count: 85 },
      ]

  const submissionChartData = [
    { name: "Approved", value: submissionsData.approved, fill: "#10b981" },
    { name: "Pending", value: submissionsData.pending, fill: "#f59e0b" },
    { name: "Declined", value: submissionsData.declined, fill: "#ef4444" },
  ]

  return (
    <div className="space-y-8">
      {/* Enrollment Trend Line Chart */}
      <div>
        <h4 className="text-sm font-medium mb-4">Enrollment Trends</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              stroke="#888888"
            />
            <YAxis 
              className="text-xs"
              stroke="#888888"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Grade Submissions Bar Chart */}
      <div>
        <h4 className="text-sm font-medium mb-4">Grade Submission Status</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={submissionChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              stroke="#888888"
            />
            <YAxis 
              className="text-xs"
              stroke="#888888"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

