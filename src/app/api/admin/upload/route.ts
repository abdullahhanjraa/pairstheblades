import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/session-edge';

export const dynamic = 'force-dynamic';

const MAX_SERVER_FILE_SIZE = 10 * 1024 * 1024; // 10 MB Hard Ceiling

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

export async function POST(req: Request) {
  try {
    // 1. Cryptographic session & version verification check
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const verified = await verifySignedSessionToken(token);

    let isAuthorized = false;
    if (verified.valid) {
      const store = await prisma.store
        .findFirst({ orderBy: { createdAt: 'asc' }, select: { adminSessionVersion: true } })
        .catch(() => null);
      isAuthorized = verified.version === (store?.adminSessionVersion ?? 1);
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrative founder session required for image uploads.' },
        { status: 401 }
      );
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided in upload request.' },
        { status: 400 }
      );
    }

    // 3. Mime-type verification
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format (${file.type}). Allowed formats: JPG, PNG, WebP, AVIF.`,
        },
        { status: 400 }
      );
    }

    // 4. File size check
    if (file.size > MAX_SERVER_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 10MB server limit.`,
        },
        { status: 400 }
      );
    }

    // 5. Read buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Generate collision-proof timestamped filename
    const timestamp = Date.now();
    const cleanOriginalName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');
    const safeFilename = `${timestamp}_${cleanOriginalName}`;

    // Target folder: only allow 'banners', 'products', or 'general'
    const safeFolder = ['banners', 'products'].includes(folder) ? folder : 'general';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sipreibgzwmeirmhhbit.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_IMGIm-DRK15yKAPS_rP2kQ_c7qkvvHx';

    let publicUrl = '';

    // Primary: Cloud Storage via Supabase CDN
    try {
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/product-media/${safeFolder}/${safeFilename}`;
      const uploadRes = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (uploadRes.ok) {
        publicUrl = `${supabaseUrl}/storage/v1/object/public/product-media/${safeFolder}/${safeFilename}`;
      } else {
        console.warn('Supabase storage upload returned status:', uploadRes.status);
      }
    } catch (storageErr) {
      console.warn('Supabase storage upload error:', storageErr);
    }

    // Fallback: Local disk if offline dev environment
    if (!publicUrl) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
        await mkdir(uploadDir, { recursive: true });
        const targetFilePath = path.join(uploadDir, safeFilename);
        await writeFile(targetFilePath, buffer);
        publicUrl = `/uploads/${safeFolder}/${safeFilename}`;
      } catch (localErr) {
        console.error('Local disk write fallback failed:', localErr);
        throw new Error('Failed to save file to cloud storage or local disk.');
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      size: file.size,
      folder: safeFolder,
    });
  } catch (err: any) {
    console.error('File Upload Error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error processing file upload.' },
      { status: 500 }
    );
  }
}
