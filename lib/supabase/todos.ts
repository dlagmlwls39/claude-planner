import type { SupabaseClient } from "@supabase/supabase-js";
import type { TodoRow } from "@/lib/types";

export async function listTodosByDate(
  supabase: SupabaseClient,
  dateISO: string
): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("date", dateISO)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as TodoRow[];
}

export async function listStandingTodos(
  supabase: SupabaseClient
): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .is("date", null)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as TodoRow[];
}

export async function createTodo(
  supabase: SupabaseClient,
  title: string,
  dateISO: string | null
): Promise<TodoRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data, error } = await supabase
    .from("todos")
    .insert({ title, date: dateISO, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as TodoRow;
}

export async function toggleTodo(
  supabase: SupabaseClient,
  id: string,
  done: boolean
): Promise<void> {
  const { error } = await supabase.from("todos").update({ is_done: done }).eq("id", id);
  if (error) throw error;
}

export async function deleteTodo(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}
