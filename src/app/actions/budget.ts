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
  notes?: string;
}) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("budget_items").insert(input);
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
