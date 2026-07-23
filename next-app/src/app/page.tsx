"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/neonClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    client.auth.getSession().then(async (result) => {
      const session = result?.data?.session;
      if (session) {
        const user = result?.data?.user;
        if (user) {
          // Garante que o nutricionista existe no banco de dados
          const { data, error } = await client
            .from("nutricionistas")
            .select("id")
            .eq("id", user.id);
            
          if (!error && data && data.length === 0) {
            await client.from("nutricionistas").insert([{
              id: user.id,
              nome: user.name || "Nutricionista",
              email: user.email
            }]);
          }
        }
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );
}
