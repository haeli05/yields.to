import { NextResponse } from "next/server";
import { loadPlasmaYields } from "@/lib/plasma-yields";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  try {
    const result = await loadPlasmaYields({ refresh });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upstream yields unavailable";
    return new NextResponse(message, { status: 502 });
  }
}
