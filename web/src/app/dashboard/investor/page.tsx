import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDbUser } from "@/lib/db-user";
import { InvestorSimulation } from "@/components/investor/investor-simulation";

export default async function InvestorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await getOrCreateDbUser(user);

  return <InvestorSimulation userId={dbUser.id} />;
}
