"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, LogOut, Sun, Moon } from "lucide-react";
import { client } from "@/lib/neonClient";

export default function Sidebar({ profile, session }: { profile?: any, session?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initial load: check document classes which are set by layout.tsx script
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
    if (isDark) {
      localStorage.theme = 'dark';
    } else {
      localStorage.theme = 'light';
    }
  };

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await client.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#141916] border-r border-gray-200 dark:border-[#2a342e] h-screen flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      <div className="p-8">
        <span className="text-xl font-black tracking-tight text-blue-600 dark:text-[#10b981]">
          Feriani Nutri
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
        <Link 
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
            isActive("/dashboard") 
              ? "bg-blue-50 text-blue-600 dark:bg-[#153424] dark:text-[#10b981]" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:bg-[#1a211d] dark:hover:text-white"
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/pacientes"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
            isActive("/pacientes") 
              ? "bg-blue-50 text-blue-600 dark:bg-[#153424] dark:text-[#10b981]" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:bg-[#1a211d] dark:hover:text-white"
          }`}
        >
          <Users size={20} />
          <span>Pacientes</span>
        </Link>
      </nav>

      <div className="p-6">
        <div className="border-t border-gray-200 dark:border-[#2a342e] pt-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-[#10b981] flex items-center justify-center dark:text-[#141916] font-bold text-lg">
              {(profile?.nome || 'G').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-[#f3f4f6] truncate">
                {profile?.nome || 'Gustavo Feriani'}
              </p>
              <p className="text-xs text-gray-500 dark:text-[#9ca3af] truncate">
                {session?.user?.email || 'teste@teste.com'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={toggleDarkMode} 
            className="flex items-center gap-3 text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white transition-colors font-medium text-sm"
          >
            {isDarkMode ? (
              <>
                <Sun size={20} />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon size={20} />
                <span>Modo Escuro</span>
              </>
            )}
          </button>

          <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 hover:text-red-600 dark:text-[#ef4444] dark:hover:text-[#f87171] transition-colors font-medium text-sm" title="Sair">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
