import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const filePath = join(process.cwd(), "public", "agent", "VisionPOS-Engine.exe");

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/x-msdownload",
        "Content-Disposition": 'attachment; filename="VisionPOS-Engine.exe"',
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return new NextResponse("Engine binary not found. Build it first with vision-agent\\build-exe.bat", { status: 404 });
  }
}
