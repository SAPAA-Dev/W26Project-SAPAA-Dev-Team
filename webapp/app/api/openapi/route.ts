import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/swagger";

export async function GET() {
  return NextResponse.json(openApiSpec);
}