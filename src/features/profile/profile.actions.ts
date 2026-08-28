"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { AVATAR_MAX_BYTES } from "@/features/images/image";
import { chosenFile, storeImage } from "@/features/images/upload";

import { parseDeleteAccountForm, parseProfileForm } from "./profile.schema";

export type ProfileFormState = {
  error?: string;
  saved?: boolean;
};

export type DeleteAccountState = {
  error?: string;
};

const USER_IMAGE_BUCKETS = ["avatars", "recipe-images"] as const;

async function removeUserImages(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  const imageUrls: string[] = [];
  const objectsByBucket = new Map<
    (typeof USER_IMAGE_BUCKETS)[number],
    string[]
  >();

  for (const bucket of USER_IMAGE_BUCKETS) {
    let offset = 0;
    const bucketPaths: string[] = [];

    while (true) {
      const { data: objects, error: listError } = await admin.storage
        .from(bucket)
        .list(userId, { limit: 100, offset });

      if (listError) throw listError;
      if (!objects.length) break;

      const paths = objects.map((object) => `${userId}/${object.name}`);
      bucketPaths.push(...paths);
      imageUrls.push(
        ...paths.map(
          (path) =>
            admin.storage.from(bucket).getPublicUrl(path).data.publicUrl,
        ),
      );

      if (objects.length < 100) break;
      offset += objects.length;
    }

    objectsByBucket.set(bucket, bucketPaths);
  }

  // Shared-plan and catalog copies can retain the original photograph URL.
  // Keep those recipes usable after the uploader removes the photograph.
  for (let index = 0; index < imageUrls.length; index += 100) {
    const { error } = await admin
      .from("recipes")
      .update({ image_url: null })
      .in("image_url", imageUrls.slice(index, index + 100));

    if (error) throw error;
  }

  for (const [bucket, paths] of objectsByBucket) {
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await admin.storage
        .from(bucket)
        .remove(paths.slice(index, index + 100));

      if (error) throw error;
    }
  }
}

export async function deleteAccount(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const parsed = parseDeleteAccountForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const admin = createSupabaseAdminClient();

  try {
    await removeUserImages(admin, user.id);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch {
    return { error: "Could not delete your account. Try again." };
  }

  // Clear the browser session after Auth has removed the account and revoked its
  // refresh tokens. The access token cannot reach user-owned rows after cascade.
  await supabase.auth.signOut();
  redirect("/sign-in?accountDeleted=1");
}

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = parseProfileForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const avatar = chosenFile(formData.get("avatar"));
  let avatarUrl: string | undefined;

  if (avatar) {
    const stored = await storeImage({
      bucket: "avatars",
      file: avatar,
      maxBytes: AVATAR_MAX_BYTES,
      supabase,
      userId: user.id,
    });

    if ("error" in stored) {
      return { error: stored.error };
    }

    avatarUrl = stored.url;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      display_name: parsed.data.displayName,
      friend_discoverable: parsed.data.discoverable,
      default_meals_per_week: parsed.data.defaultMealsPerWeek,
      default_enabled_slots: parsed.data.defaultEnabledSlots,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not save your profile. Try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");

  return { saved: true };
}
