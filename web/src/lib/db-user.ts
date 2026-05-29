import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/** Resolve Supabase auth user to Prisma User (creates on first login). */
export async function getOrCreateDbUser(supabaseUser: User) {
  let dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name,
        avatarUrl: supabaseUser.user_metadata?.avatar_url,
      },
    });
  }

  return dbUser;
}
