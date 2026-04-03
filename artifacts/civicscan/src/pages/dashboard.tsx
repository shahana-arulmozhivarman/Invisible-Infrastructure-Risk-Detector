import { useEffect, useState } from "react";
import { useGetReportsSummary, useGetReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AlertTriangle, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Real-time infrastructure health metrics.</p>
        </div>
        <Link href="/map" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <MapPin className="mr-2 h-4 w-4" /> Open Live Map
        </Link>
      </div>

      {isSummaryLoading ? (
        <div className="h-32 flex items-center justify-center border rounded-lg"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_reports}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pending_count} pending, {summary.in_progress_count} in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{summary.critical_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summary.avg_risk_score)}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Repair Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">₹{(summary.estimated_repair_cost_min / 100000).toFixed(1)}L - ₹{(summary.estimated_repair_cost_max / 100000).toFixed(1)}L</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Recent High-Risk Reports</h2>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]">
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
          <div className="h-64 flex items-center justify-center border rounded-lg"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : reports && reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.slice(0, 9).map((report) => (
              <Card key={report.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={getSeverityColor(report.severity)}>
                      {report.severity.toUpperCase()}
                    </Badge>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                      {report.risk_score}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-1" title={report.issue_type}>{report.issue_type}</CardTitle>
                  <div className="flex items-center text-xs text-muted-foreground mt-1 line-clamp-1">
                    <MapPin className="w-3 h-3 mr-1 inline" /> {report.location}
                  </div>
                </CardHeader>
                <CardContent className="text-sm flex-1">
                  <p className="line-clamp-2 text-slate-600">{report.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center border rounded-lg text-slate-500">
            No reports found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
