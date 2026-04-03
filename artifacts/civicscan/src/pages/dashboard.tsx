import { useState } from "react";
import { useGetReportsSummary, useGetReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AlertTriangle, MapPin, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

function getRiskScoreColor(score: number) {
  if (score >= 85) return 'text-red-400 bg-red-500/15';
  if (score >= 70) return 'text-orange-400 bg-orange-500/15';
  if (score >= 50) return 'text-yellow-400 bg-yellow-500/15';
  return 'text-green-400 bg-green-500/15';
}

export default function DashboardPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: summary, isLoading: isSummaryLoading } = useGetReportsSummary();
  const { data: reports, isLoading: isReportsLoading } = useGetReports(
    severityFilter !== "all" ? { severity: severityFilter } : {}
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
          <p className="text-slate-400 mt-1">Real-time infrastructure health metrics.</p>
        </div>
        <Link href="/map" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white h-10 px-4 py-2 transition-colors">
          <MapPin className="mr-2 h-4 w-4" /> Open Live Map
        </Link>
      </div>

      {isSummaryLoading ? (
        <div className="h-32 flex items-center justify-center rounded-lg border border-white/10">
          <Loader2 className="animate-spin text-blue-400" />
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Active Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary.total_reports}</div>
              <p className="text-xs text-slate-500 mt-1">
                {summary.pending_count} pending, {summary.in_progress_count} in progress
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{summary.critical_count}</div>
              <p className="text-xs text-slate-500 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Math.round(summary.avg_risk_score)}
                <span className="text-sm font-normal text-slate-500">/100</span>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Est. Repair Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">
                ₹{(summary.estimated_repair_cost_min / 100000).toFixed(1)}L
                <span className="text-slate-400"> – </span>
                ₹{(summary.estimated_repair_cost_max / 100000).toFixed(1)}L
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight text-white">Recent High-Risk Reports</h2>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-slate-300">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isReportsLoading ? (
          <div className="h-64 flex items-center justify-center rounded-lg border border-white/10">
            <Loader2 className="animate-spin text-blue-400" />
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.slice(0, 9).map((report) => (
              <Card key={report.id} className="glass-card border-0 flex flex-col hover:border hover:border-blue-500/20 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={getSeverityColor(report.severity)}>
                      {report.severity.toUpperCase()}
                    </Badge>
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${getRiskScoreColor(report.risk_score)}`}>
                      {report.risk_score}
                    </div>
                  </div>
                  <CardTitle className="text-base text-white line-clamp-1" title={report.issue_type}>
                    {report.issue_type}
                  </CardTitle>
                  <div className="flex items-center text-xs text-slate-500 mt-1 line-clamp-1">
                    <MapPin className="w-3 h-3 mr-1 inline shrink-0" /> {report.location}
                  </div>
                </CardHeader>
                <CardContent className="text-sm flex-1">
                  <p className="line-clamp-2 text-slate-400">{report.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center rounded-lg border border-white/10 text-slate-500">
            No reports found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
