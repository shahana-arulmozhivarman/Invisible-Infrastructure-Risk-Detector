import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { AnalyzePhotoBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/analyze-photo", async (req, res): Promise<void> => {
  const parsed = AnalyzePhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { image_data, mime_type } = parsed.data;

  if (!image_data) {
    res.status(400).json({ error: "image_data is required" });
    return;
  }

  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });
    return;
  }

  // Ensure data URI format
  const mimeType = mime_type ?? "image/jpeg";
  const dataUri = image_data.startsWith("data:")
    ? image_data
    : `data:${mimeType};base64,${image_data}`;

  const prompt = `You are an urban infrastructure damage assessment AI. Analyze this image of a city infrastructure issue and respond ONLY with valid JSON (no markdown, no explanation).

Respond with exactly this JSON structure:
{
  "issue_type": "<specific infrastructure issue type, e.g. Pothole, Broken Streetlight, Water Leak, Cracked Pavement, Damaged Bridge, Fallen Tree, Broken Signage, Flooded Road, Collapsed Drain>",
  "severity": "<one of: low | medium | high | critical>",
  "description": "<2-3 sentence factual description of the visible damage, its extent, and immediate risks>"
}

Base severity on visible damage extent and public safety risk:
- critical: immediate danger to life or structural failure
- high: significant hazard requiring urgent attention
- medium: notable damage needing scheduled repair
- low: minor cosmetic or non-urgent issue`;

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://civicscan.replit.app",
        "X-Title": "CivicScan",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: dataUri },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      logger.error({ status: resp.status, body: text }, "OpenRouter vision API error");
      res.status(500).json({ error: "AI analysis failed" });
      return;
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = json?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.error({ raw }, "No JSON in vision response");
      res.status(500).json({ error: "Could not parse AI response" });
      return;
    }

    const parsed2 = JSON.parse(jsonMatch[0]) as {
      issue_type?: string;
      severity?: string;
      description?: string;
    };

    const validSeverities = ["low", "medium", "high", "critical"];
    const severity = validSeverities.includes(parsed2.severity ?? "")
      ? parsed2.severity
      : "medium";

    res.json({
      issue_type: parsed2.issue_type ?? "Infrastructure Damage",
      severity,
      description: parsed2.description ?? "Infrastructure damage detected. Further inspection required.",
    });
  } catch (err) {
    logger.error({ err }, "Photo analysis failed");
    res.status(500).json({ error: "AI analysis failed" });
  }
});

export default router;
