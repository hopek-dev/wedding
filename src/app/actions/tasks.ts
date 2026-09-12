"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/supabase/types";

export async function listTasks() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(input: {
  title: string;
  event_id?: string | null;
  category: string;
  start_date?: string;
  due_date?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  notes?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("tasks").insert(input);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/tasks");
}
