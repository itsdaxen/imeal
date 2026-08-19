import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { checkImage, imagePath } from "./image";

type StoreImageResult = { url: string } | { error: string };

/**
 * Uploads under a folder named for the user, which is what the storage policies
 * scope every write on, and returns the public URL.
 */
export async function storeImage({
  bucket,
  file,
  maxBytes,
  supabase,
  userId,
}: {
  bucket: "avatars" | "recipe-images";
  file: File;
  maxBytes: number;
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<StoreImageResult> {
  const check = checkImage({ size: file.size, type: file.type }, maxBytes);

  if (!check.ok) {
    return { error: check.reason };
  }

  const path = imagePath(userId, file.type);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { error: "Could not upload that image. Try again." };
  }

  return {
    url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
  };
}

/** A file input with nothing chosen still arrives, as an empty file. */
export function chosenFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}
