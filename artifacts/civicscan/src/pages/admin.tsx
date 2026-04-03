import { useState } from "react";
import { useGetReports, useUpdateReportStatus, getGetReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Control</h1>
        <p className="text-slate-500 mt-2">Manage and update infrastructure reports.</p>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[180px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : reports?.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                    {report.risk_score}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-slate-900">{report.issue_type}</TableCell>
                <TableCell className="text-slate-500 max-w-[250px] truncate" title={report.location}>
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
                    <SelectTrigger className="h-8 text-xs font-medium">
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
