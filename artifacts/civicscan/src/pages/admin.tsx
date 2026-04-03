import { useGetReports, useUpdateReportStatus, getGetReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

function getRowAccent(severity: string) {
  switch (severity) {
    case 'critical': return 'border-l-2 border-l-red-500';
    case 'high': return 'border-l-2 border-l-orange-500';
    case 'medium': return 'border-l-2 border-l-yellow-500';
    case 'low': return 'border-l-2 border-l-green-500';
    default: return '';
  }
}

function getRiskScoreColor(score: number) {
  if (score >= 85) return 'text-red-400 bg-red-500/15';
  if (score >= 70) return 'text-orange-400 bg-orange-500/15';
  if (score >= 50) return 'text-yellow-400 bg-yellow-500/15';
  return 'text-green-400 bg-green-500/15';
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useGetReports();
  const updateStatus = useUpdateReportStatus();

  const handleStatusChange = (id: string, status: "pending" | "in_progress" | "resolved") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Control</h1>
        <p className="text-slate-400 mt-2">Manage and update infrastructure reports.</p>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-400 font-semibold w-[90px]">Score</TableHead>
              <TableHead className="text-slate-400 font-semibold">Type</TableHead>
              <TableHead className="text-slate-400 font-semibold">Location</TableHead>
              <TableHead className="text-slate-400 font-semibold">Severity</TableHead>
              <TableHead className="text-slate-400 font-semibold">Date</TableHead>
              <TableHead className="text-slate-400 font-semibold w-[180px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center border-0">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                </TableCell>
              </TableRow>
            ) : reports?.map((report) => (
              <TableRow key={report.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${getRowAccent(report.severity)}`}>
                <TableCell className="font-medium">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${getRiskScoreColor(report.risk_score)}`}>
                    {report.risk_score}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-white">{report.issue_type}</TableCell>
                <TableCell className="text-slate-400 max-w-[220px] truncate text-sm" title={report.location}>
                  {report.location}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSeverityColor(report.severity)}>
                    {report.severity.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(report.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={report.status}
                    onValueChange={(val: any) => handleStatusChange(report.id, val)}
                    disabled={updateStatus.isPending && updateStatus.variables?.id === report.id}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-white/5 border-white/10 text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {reports?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
