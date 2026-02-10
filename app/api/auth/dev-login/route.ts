import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}