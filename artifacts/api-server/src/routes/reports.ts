import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  CreateReportBody,
  UpdateReportStatusBody,
  UpdateReportStatusParams,
  GetReportParams,
  GetReportsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── In-memory store ──────────────────────────────────────────────────────────

interface Report {
  id: string;
  issue_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  status: "pending" | "in_progress" | "resolved";
  risk_score: number;
  priority_label: string;
  repair_cost_range: string;
  recommendation: string;
  image_url: string | null;
  created_at: string;
}

let reportIdCounter = 7;

function generateId(): string {
  return `rpt_${reportIdCounter++}`;
}

const reports: Report[] = [
  {
    id: "rpt_1",
    issue_type: "Pothole",
    severity: "critical",
    description:
      "Large pothole approximately 2 feet wide and 8 inches deep on a heavily trafficked arterial road. Multiple vehicles have been damaged. Immediate repair required to prevent accidents.",
    location: "Western Express Highway, Andheri East, Mumbai",
    latitude: 19.1136,
    longitude: 72.8697,
    status: "pending",
    risk_score: 94,
    priority_label: "CRITICAL — URGENT ACTION",
    repair_cost_range: "₹45,000 – ₹1,20,000",
    recommendation:
      "Deploy emergency road repair crew within 24 hours. Set up traffic cones and warning signs immediately. Use hot-mix asphalt for permanent patching.",
    image_url: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rpt_2",
    issue_type: "Broken Streetlight",
    severity: "high",
    description:
      "Three consecutive streetlights have been non-functional for over a week on a stretch near a busy pedestrian crossing. Safety risk especially at night.",
    location: "Linking Road, Bandra West, Mumbai",
    latitude: 19.0596,
    longitude: 72.8295,
    status: "in_progress",
    risk_score: 78,
    priority_label: "HIGH PRIORITY",
    repair_cost_range: "₹18,000 – ₹55,000",
    recommendation:
      "Inspect electrical connection and replace faulty bulbs and ballasts. Temporary portable lights should be deployed until repair is complete.",
    image_url: null,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rpt_3",
    issue_type: "Water Main Leak",
    severity: "critical",
    description:
      "Visible water seeping through road surface causing flooding. Suspected underground water main break. Road is partially submerged, posing a drowning risk in heavy rain.",
    location: "Dharavi Main Road, Dharavi, Mumbai",
    latitude: 19.0428,
    longitude: 72.8559,
    status: "pending",
    risk_score: 97,
    priority_label: "CRITICAL — URGENT ACTION",
    repair_cost_range: "₹2,50,000 – ₹8,00,000",
    recommendation:
      "Shut off water supply to affected zone immediately. Deploy BMC water department and excavation team. Divert traffic and notify residents of water disruption.",
    image_url: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rpt_4",
    issue_type: "Cracked Pavement",
    severity: "medium",
    description:
      "Extensive cracking along 50 meters of footpath near school zone. Risk of tripping injuries, especially for elderly and schoolchildren.",
    location: "S.V. Road, Goregaon West, Mumbai",
    latitude: 19.1663,
    longitude: 72.8526,
    status: "pending",
    risk_score: 62,
    priority_label: "MODERATE — SCHEDULE REPAIR",
    repair_cost_range: "₹25,000 – ₹75,000",
    recommendation:
      "Schedule pavement resurface during off-peak hours. Apply crack-sealing compound as immediate interim fix. Inspect subsurface drainage.",
    image_url: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rpt_5",
    issue_type: "Fallen Tree Branch",
    severity: "high",
    description:
      "A large tree branch has fallen partially obstructing the road near a junction. Risk of accident during monsoon winds. Branch diameter approximately 30cm.",
    location: "Pedder Road, Breach Candy, Mumbai",
    latitude: 18.9712,
    longitude: 72.8054,
    status: "resolved",
    risk_score: 75,
    priority_label: "HIGH PRIORITY",
    repair_cost_range: "₹8,000 – ₹20,000",
    recommendation:
      "Tree branch has been cleared by the BMC horticulture team. Recommend full inspection of ageing tree for further trimming.",
    image_url: null,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rpt_6",
    issue_type: "Damaged Bridge Railing",
    severity: "high",
    description:
      "Steel railing on pedestrian bridge over Mithi River is severely corroded and partially collapsed. Falls into river possible. Safety critical.",
    location: "Kurla-Sion Link Road, Kurla West, Mumbai",
    latitude: 19.0726,
    longitude: 72.8781,
    status: "in_progress",
    risk_score: 88,
    priority_label: "HIGH PRIORITY — STRUCTURAL",
    repair_cost_range: "₹1,20,000 – ₹3,50,000",
    recommendation:
      "Temporary fencing should be installed immediately. Engage structural engineer for full load assessment. Replace corroded railing sections with galvanized steel.",
    image_url: null,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCostRange(range: string): [number, number] {
  const cleaned = range.replace(/[₹,\s]/g, "");
  const parts = cleaned.split("–");
  if (parts.length === 2) {
    return [parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0];
  }
  return [0, 0];
}

function calcRepairCostRange(
  severity: string,
  issueType: string
): string {
  const base: Record<string, [number, number]> = {
    low: [5000, 20000],
    medium: [20000, 80000],
    high: [80000, 350000],
    critical: [300000, 1200000],
  };
  const multiplier: Record<string, number> = {
    "Water Main Leak": 4,
    "Damaged Bridge": 3,
    "Bridge Railing": 2,
    Pothole: 1,
    "Broken Streetlight": 1,
    "Cracked Pavement": 0.8,
    "Fallen Tree": 0.5,
  };
  let mult = 1;
  for (const [key, val] of Object.entries(multiplier)) {
    if (issueType.toLowerCase().includes(key.toLowerCase())) {
      mult = val;
      break;
    }
  }
  const [lo, hi] = base[severity] ?? base["medium"];
  const lo2 = Math.round((lo * mult) / 1000) * 1000;
  const hi2 = Math.round((hi * mult) / 1000) * 1000;
  const fmt = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")} Lakh`
      : `₹${n.toLocaleString("en-IN")}`;
  return `${fmt(lo2)} – ${fmt(hi2)}`;
}

async function callOpenRouter(
  messages: Array<{ role: string; content: unknown }>,
  model = "mistralai/mistral-7b-instruct"
): Promise<string> {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://civicscan.replit.app",
      "X-Title": "CivicScan",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter error ${resp.status}: ${text}`);
  }

  const json = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json?.choices?.[0]?.message?.content ?? "";
}

async function scoreReport(
  issueType: string,
  severity: string,
  description: string,
  location: string
): Promise<{ risk_score: number; priority_label: string; recommendation: string }> {
  const prompt = `You are an urban infrastructure risk assessment AI. Analyze this report and respond ONLY with valid JSON (no markdown, no explanation).

Report:
- Issue type: ${issueType}
- Severity: ${severity}
- Description: ${description}
- Location: ${location}

Respond with exactly this JSON structure:
{
  "risk_score": <integer 0-100>,
  "priority_label": "<one of: CRITICAL — URGENT ACTION | HIGH PRIORITY | MODERATE — SCHEDULE REPAIR | LOW PRIORITY — MONITOR>",
  "recommendation": "<2-3 actionable sentences for city engineers>"
}`;

  try {
    const raw = await callOpenRouter([{ role: "user", content: prompt }]);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as {
      risk_score?: number;
      priority_label?: string;
      recommendation?: string;
    };
    return {
      risk_score: Math.min(100, Math.max(0, parsed.risk_score ?? 50)),
      priority_label: parsed.priority_label ?? "MODERATE — SCHEDULE REPAIR",
      recommendation: parsed.recommendation ?? "Inspect the issue and schedule repair per standard protocol.",
    };
  } catch (err) {
    logger.warn({ err }, "AI scoring failed, using fallback");
    // Rule-based fallback
    const scoreMap: Record<string, number> = {
      critical: 90,
      high: 75,
      medium: 55,
      low: 30,
    };
    const labelMap: Record<string, string> = {
      critical: "CRITICAL — URGENT ACTION",
      high: "HIGH PRIORITY",
      medium: "MODERATE — SCHEDULE REPAIR",
      low: "LOW PRIORITY — MONITOR",
    };
    return {
      risk_score: scoreMap[severity] ?? 50,
      priority_label: labelMap[severity] ?? "MODERATE — SCHEDULE REPAIR",
      recommendation: `Inspect the ${issueType} at ${location} and schedule repair per standard protocol for ${severity}-severity issues.`,
    };
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/reports/summary", async (_req, res): Promise<void> => {
  const total = reports.length;
  const critical = reports.filter((r) => r.severity === "critical").length;
  const high = reports.filter((r) => r.severity === "high").length;
  const medium = reports.filter((r) => r.severity === "medium").length;
  const low = reports.filter((r) => r.severity === "low").length;
  const avgRisk =
    total > 0 ? reports.reduce((s, r) => s + r.risk_score, 0) / total : 0;
  const pending = reports.filter((r) => r.status === "pending").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  let totalMin = 0;
  let totalMax = 0;
  for (const r of reports) {
    const [lo, hi] = parseCostRange(r.repair_cost_range);
    totalMin += lo;
    totalMax += hi;
  }

  res.json({
    total_reports: total,
    critical_count: critical,
    high_count: high,
    medium_count: medium,
    low_count: low,
    avg_risk_score: Math.round(avgRisk * 10) / 10,
    estimated_repair_cost_min: totalMin,
    estimated_repair_cost_max: totalMax,
    pending_count: pending,
    in_progress_count: inProgress,
    resolved_count: resolved,
  });
});

router.get("/reports", async (req, res): Promise<void> => {
  const params = GetReportsQueryParams.safeParse(req.query);
  let filtered = [...reports];

  if (params.success) {
    if (params.data.severity) {
      filtered = filtered.filter((r) => r.severity === params.data.severity);
    }
    if (params.data.status) {
      filtered = filtered.filter((r) => r.status === params.data.status);
    }
  }

  // Sort by risk_score descending
  filtered.sort((a, b) => b.risk_score - a.risk_score);
  res.json(filtered);
});

router.post("/reports", async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { issue_type, severity, description, location, latitude, longitude, image_url } =
    parsed.data;

  let scoring;
  try {
    scoring = await scoreReport(issue_type, severity, description, location);
  } catch (err) {
    req.log.error({ err }, "Scoring failed");
    scoring = {
      risk_score: 50,
      priority_label: "MODERATE — SCHEDULE REPAIR",
      recommendation: `Inspect the ${issue_type} at ${location} and schedule repair.`,
    };
  }

  const report: Report = {
    id: generateId(),
    issue_type,
    severity: severity as Report["severity"],
    description,
    location,
    latitude,
    longitude,
    status: "pending",
    risk_score: scoring.risk_score,
    priority_label: scoring.priority_label,
    repair_cost_range: calcRepairCostRange(severity, issue_type),
    recommendation: scoring.recommendation,
    image_url: image_url ?? null,
    created_at: new Date().toISOString(),
  };

  reports.unshift(report);
  res.status(201).json(report);
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const report = reports.find((r) => r.id === params.data.id);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(report);
});

router.patch("/reports/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];

  const params = UpdateReportStatusParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateReportStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const idx = reports.findIndex((r) => r.id === params.data.id);
  if (idx === -1) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  reports[idx] = { ...reports[idx]!, status: body.data.status as Report["status"] };
  res.json(reports[idx]);
});

export default router;
