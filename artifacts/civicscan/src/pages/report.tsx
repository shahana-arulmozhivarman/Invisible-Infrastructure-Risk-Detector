import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateReport, 
  useAnalyzePhoto,
  CreateReportBodySeverity 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Loader2, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  issue_type: z.string().min(2, "Issue type is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(5, "Location is required"),
  latitude: z.number(),
  longitude: z.number(),
  image_url: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReportPage() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  
  const createReport = useCreateReport();
  const analyzePhoto = useAnalyzePhoto();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue_type: "",
      severity: "low",
      description: "",
      location: "",
      latitude: 19.0760,
      longitude: 72.8777,
      image_url: null,
    },
  });

  const handleLocationCapture = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          form.setValue("location", "Current Location (GPS)");
          toast({
            title: "Location captured",
            description: "Coordinates updated successfully.",
          });
        },
        () => {
          toast({
            title: "Location failed",
            description: "Could not get your location.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      form.setValue("image_url", base64Data);

      analyzePhoto.mutate(
        { data: { image_data: base64Data.split(',')[1], mime_type: file.type } },
        {
          onSuccess: (res) => {
            form.setValue("issue_type", res.issue_type);
            form.setValue("severity", res.severity as any);
            form.setValue("description", res.description);
            setIsCapturing(false);
            toast({
              title: "AI Analysis Complete",
              description: "Form fields auto-filled based on the image.",
            });
          },
          onError: () => {
            setIsCapturing(false);
            toast({
              title: "Analysis Failed",
              description: "Could not analyze the image automatically.",
              variant: "destructive"
            });
          }
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: FormValues) => {
    createReport.mutate({ data }, {
      onSuccess: (res) => {
        setSuccessData(res);
        toast({
          title: "Report Submitted",
          description: "Your infrastructure report has been recorded.",
        });
      },
      onError: (err) => {
        toast({
          title: "Submission Failed",
          description: "There was an error submitting the report.",
          variant: "destructive"
        });
      }
    });
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto mt-8 animate-in fade-in zoom-in duration-300">
        <Card className="border-green-100 bg-green-50/50">
          <CardHeader className="text-center pb-2">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-900">Report Logged Successfully</CardTitle>
            <CardDescription className="text-green-700">
              Risk assessed and prioritized for action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk Score</p>
                <p className="text-3xl font-bold text-slate-900">{successData.risk_score}<span className="text-lg text-slate-400">/100</span></p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</p>
                <p className="text-lg font-bold text-slate-900">{successData.priority_label}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Est. Repair Cost</p>
                <p className="text-slate-900 font-medium">{successData.repair_cost_range}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommendation</p>
                <p className="text-slate-900 text-sm leading-relaxed">{successData.recommendation}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <Button onClick={() => { setSuccessData(null); form.reset(); }} variant="outline">
              Submit Another Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Infrastructure Report</h1>
        <p className="text-slate-500 mt-2">Log a new urban infrastructure issue for assessment.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Photo Upload Section */}
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-center hover:bg-slate-100 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleImageUpload}
                  disabled={isCapturing}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  {isCapturing ? (
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                  <div className="text-sm font-medium text-slate-700">
                    {isCapturing ? "AI is analyzing image..." : "Take Photo or Upload Image"}
                  </div>
                  <p className="text-xs text-slate-500">Auto-fills report details using AI</p>
                </div>
              </div>

              {form.watch("image_url") && (
                <div className="relative w-full h-48 rounded-md overflow-hidden border">
                  <img src={form.watch("image_url")!} alt="Preview" className="object-cover w-full h-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issue_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pothole, Water Leak" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the issue in detail..." className="h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter address or landmark" {...field} className="flex-1" />
                      </FormControl>
                      <Button type="button" variant="secondary" onClick={handleLocationCapture}>
                        <MapPin className="w-4 h-4 mr-2" /> GPS
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={createReport.isPending || isCapturing}>
                {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
