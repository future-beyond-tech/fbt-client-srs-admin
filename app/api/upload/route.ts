import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Image size must be 2MB or less" }, { status: 400 });
  }

  const extension = file.name.split(".").pop() ?? "png";
  const fileName = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await fs.writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

  return NextResponse.json(
    {
      message: "Upload successful",
      url: `/uploads/${fileName}`,
    },
    { status: 201 },
  );
}
