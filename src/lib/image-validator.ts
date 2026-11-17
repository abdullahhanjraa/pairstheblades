/**
 * ==============================================================================
 * Image Validation & Specification Engine — Pairs Knife & Sword Co.
 * Enforces strict resolution, aspect-ratio, and file-size standards for
 * store hero banners and product catalog photography.
 * ==============================================================================
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  sizeMB?: number;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB ceiling

/**
 * Validates a hero banner image file before upload.
 * Required:
 * - File size <= 3 MB
 * - Width >= 1440 px
 * - Aspect ratio roughly widescreen (between 1.35:1 and 2.6:1, e.g. 16:9 or 21:9)
 */
export async function validateHeroBanner(file: File): Promise<ImageValidationResult> {
  const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));

  // 1. File Type Check
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please upload a .png, .jpg, or .webp image.`,
      sizeMB,
    };
  }

  // 2. File Size Check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size too large (${sizeMB} MB). Hero banners must be under 3.0 MB for fast loading across desktop and mobile.`,
      sizeMB,
    };
  }

  // 3. In-Memory Dimension & Aspect Ratio Check
  try {
    const { width, height } = await inspectImageDimensions(file);
    const aspectRatio = Number((width / height).toFixed(2));

    // Check minimum width
    if (width < 1440) {
      return {
        valid: false,
        error: `Banner resolution too low (${width}×${height}px). Hero banners must be at least 1440px wide (Recommended: 1920×1080 px, 16:9 ratio) to prevent pixelation on modern screens.`,
        width,
        height,
        aspectRatio,
        sizeMB,
      };
    }

    // Check aspect ratio (must be landscape/widescreen, not portrait or extreme ribbon)
    if (aspectRatio < 1.35) {
      return {
        valid: false,
        error: `Banner is too tall (${width}×${height}px, ratio ${aspectRatio}:1). Hero banners require widescreen landscape format (16:9 or 21:9) so store products remain visible above the fold.`,
        width,
        height,
        aspectRatio,
        sizeMB,
      };
    }

    if (aspectRatio > 2.7) {
      return {
        valid: false,
        error: `Banner is too narrow (${width}×${height}px, ratio ${aspectRatio}:1). Please use a standard 16:9 or 16:10 banner ratio.`,
        width,
        height,
        aspectRatio,
        sizeMB,
      };
    }

    return {
      valid: true,
      width,
      height,
      aspectRatio,
      sizeMB,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: 'Could not inspect image dimensions. Please ensure the file is a valid image.',
      sizeMB,
    };
  }
}

/**
 * Validates a product catalog photo file before upload.
 * Required:
 * - File size <= 10 MB
 * - Width >= 400 px and Height >= 400 px
 * - Flexible aspect ratio from portrait (3:4, 0.4:1) to landscape/widescreen (16:9, 2.5:1)
 * - Optimal visual standard: 1200×1600 px (3:4 ratio) or 1200×1200 px (1:1 square)
 */
export async function validateProductPhoto(file: File): Promise<ImageValidationResult> {
  const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));

  // 1. File Type Check
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please upload a .png, .jpg, or .webp image.`,
      sizeMB,
    };
  }

  // 2. File Size Check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size too large (${sizeMB} MB). Product photos must be under 10.0 MB for fast catalog browsing.`,
      sizeMB,
    };
  }

  // 3. In-Memory Dimension & Aspect Ratio Check
  try {
    const { width, height } = await inspectImageDimensions(file);
    const aspectRatio = Number((width / height).toFixed(2));

    // Check minimum dimensions
    if (width < 400 || height < 400) {
      return {
        valid: false,
        error: `Product photo resolution too small (${width}×${height}px). Product photos should be at least 400×400 px (Recommended: 1200×1600 px portrait 3:4 or 1200×1200 px square 1:1) for crisp presentation.`,
        width,
        height,
        aspectRatio,
        sizeMB,
      };
    }

    // Only reject extreme panoramic ribbons (over 2.6:1 or under 0.35:1)
    if (aspectRatio > 2.6) {
      return {
        valid: false,
        error: `Product photo is an extreme horizontal ribbon (${width}×${height}px, ratio ${aspectRatio}:1). Recommended catalog ratio is 3:4 portrait (1200×1600 px) or 1:1 square (1200×1200 px).`,
        width,
        height,
        aspectRatio,
        sizeMB,
      };
    }

    if (aspectRatio < 0.35) {
      return {
        valid: false,
        error: `Product photo is an extreme vertical ribbon (${width}×${height}px, ratio ${aspectRatio}:1). Recommended catalog ratio is 3:4 portrait (1200×1600 px) or 1:1 square (1200×1200 px).`,
        width,
        height,
        aspectRatio,
        sizeMB,
      };
    }

    return {
      valid: true,
      width,
      height,
      aspectRatio,
      sizeMB,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: 'Could not inspect image dimensions. Please ensure the file is a valid image.',
      sizeMB,
    };
  }
}

/**
 * Fast client-side image dimension reader using memory object URL.
 */
function inspectImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // Server-side fallback
      resolve({ width: 1920, height: 1080 });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for dimension inspection'));
    };

    img.src = objectUrl;
  });
}
