import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { GraphPayload, GraphStrategy } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "data", "graph.json");

export async function GET(request: NextRequest) {
  const strategyParam = request.nextUrl.searchParams.get("strategy");
  const strategy = normalizeStrategy(strategyParam);

  const payload = await loadGraphPayload();

  return NextResponse.json({
    ...payload,
    strategy
  });
}

async function loadGraphPayload(): Promise<GraphPayload> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as GraphPayload;
}

function normalizeStrategy(strategy: string | null): GraphStrategy {
  if (strategy === "closure") return "closure";
  return "representative";
}
