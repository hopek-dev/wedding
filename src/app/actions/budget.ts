"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { BudgetItem } from "@/lib/supabase/types";
import { requireAdmin } from "@/lib/require-admin";

export async function listBudgetItems() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as BudgetItem[];
}

export async function createBudgetItem(input: {
  category: string;
  vendor_name?: string;
  event_id?: string | null;
  estimated_cost: number;
  actual_cost?: number;
  amount_paid?: number;
  due_date?: string;
  status?: BudgetItem["status"];
  cost_type?: BudgetItem["cost_type"];
  per_guest_cost?: number | null;
  child_cost?: number | null;
  teen_cost?: number | null;
  min_guests?: number | null;
  notes?: string;
}) {
  await requireAdmin();
  const supabase = createServiceClient();
  // The child rate and the minimum are only sent when they are set, so a database that hasn't had migration 0014
  // or 0015 yet still takes every other expense.
  const { child_cost, teen_cost, min_guests, ...rest } = input;
  const { error } = await supabase.from("budget_items").insert({
    ...rest,
    ...(child_cost != null ? { child_cost } : {}),
    ...(teen_cost != null ? { teen_cost } : {}),
    ...(min_guests != null ? { min_guests } : {}),
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/budget");
}

export async function updateBudgetItem(id: string, patch: Partial<BudgetItem>) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("budget_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/budget");
}

export async function deleteBudgetItem(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("budget_items").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/budget");
}
