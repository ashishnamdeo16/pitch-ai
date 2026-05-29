import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDbUser } from "@/lib/db-user";
import { PracticeSession } from "@/components/practice/practice-session";

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await getOrCreateDbUser(user);

  return <PracticeSession userId={dbUser.id} />;
}
