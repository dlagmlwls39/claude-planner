import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/ui/BottomTabBar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[480px] min-h-screen bg-pastel-cream pb-16">
      {children}
      <BottomTabBar />
    </div>
  );
}
