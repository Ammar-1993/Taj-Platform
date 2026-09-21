import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}

async function handleRevalidation(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const tag = request.nextUrl.searchParams.get("tag");
  const path = request.nextUrl.searchParams.get("path");

  // Validate revalidation secret
  const expectedSecret =
    process.env.REVALIDATION_SECRET || "taj-revalidate-secret-token";
  if (secret !== expectedSecret) {
    return NextResponse.json(
      { message: "Invalid secret token" },
      { status: 401 }
    );
  }

  if (!tag && !path) {
    return NextResponse.json(
      { message: 'Missing "tag" or "path" parameter to revalidate' },
      { status: 400 }
    );
  }

  const revalidated: { tag?: string; path?: string } = {};

  if (tag) {
    revalidateTag(tag);
    revalidated.tag = tag;
  }

  if (path) {
    revalidatePath(path);
    revalidated.path = path;
  }

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    ...revalidated,
  });
}
