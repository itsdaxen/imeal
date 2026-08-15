"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const shareSchema = z.object({ recipeId: z.uuid(), friendId: z.uuid() });

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { supabase, userId: user.id };
}

export async function shareRecipe(formData: FormData) {
  const parsed = shareSchema.safeParse({
    recipeId: formData.get("recipeId"),
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // Ownership and friendship are both enforced by the insert policy.
  await supabase.from("recipe_shares").insert({
    recipe_id: parsed.data.recipeId,
    shared_with: parsed.data.friendId,
    shared_by: userId,
  });

  revalidatePath(`/recipes/${parsed.data.recipeId}`);
}

export async function unshareRecipe(formData: FormData) {
  const parsed = shareSchema.safeParse({
    recipeId: formData.get("recipeId"),
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  await supabase
    .from("recipe_shares")
    .delete()
    .eq("recipe_id", parsed.data.recipeId)
    .eq("shared_with", parsed.data.friendId)
    .eq("shared_by", userId);

  revalidatePath(`/recipes/${parsed.data.recipeId}`);
}

export async function dropSharedRecipe(formData: FormData) {
  const recipeId = z.uuid().safeParse(formData.get("recipeId"));

  if (!recipeId.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  await supabase
    .from("recipe_shares")
    .delete()
    .eq("recipe_id", recipeId.data)
    .eq("shared_with", userId);

  revalidatePath("/recipes/shared");
}
