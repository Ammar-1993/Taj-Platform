import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function isValidSecret(provided: string | null | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}

async function handleRevalidation(request: NextRequest) {
  const expectedSecret = process.env.REVALIDATION_SECRET?.trim();

  // Fail-Closed: reject if REVALIDATION_SECRET is not configured in environment
  if (!expectedSecret) {
    return NextResponse.json(
      { message: "Revalidation endpoint is not configured" },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const headerSecret = request.headers.get("x-revalidate-secret")?.trim() || bearerSecret;
  const querySecret = searchParams.get("secret");

  let bodyParams: { secret?: string; tag?: string; path?: string } = {};
  if (request.method === "POST") {
    try {
      bodyParams = await request.json();
    } catch {
      // Ignore empty or non-JSON body when query params are used
    }
  }

  const providedSecret = headerSecret || bodyParams.secret || querySecret;

  if (!isValidSecret(providedSecret, expectedSecret)) {
    return NextResponse.json(
      { message: "Invalid secret token" },
      { status: 401 }
    );
  }

  const tag = bodyParams.tag || searchParams.get("tag");
  const path = bodyParams.path || searchParams.get("path");

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
