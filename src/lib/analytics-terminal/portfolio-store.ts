import fs from "node:fs/promises";
import path from "node:path";
import {
  analyticsSessionDataSchema,
  emptySessionData,
  type AnalyticsSessionData,
} from "./portfolio-schema";

const DATA_FILE = path.join(process.cwd(), "data", "model-portfolios.json");

/** Global model portfolios (admin-managed; shared by all subscribers). */
export async function readModelPortfolios(): Promise<AnalyticsSessionData> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = analyticsSessionDataSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptySessionData();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return emptySessionData();
    throw e;
  }
}

export async function writeModelPortfolios(data: AnalyticsSessionData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const validated = analyticsSessionDataSchema.parse(data);
  await fs.writeFile(DATA_FILE, JSON.stringify(validated, null, 2), "utf8");
}
