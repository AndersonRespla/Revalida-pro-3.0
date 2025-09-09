import { useEffect, useState } from "react";

// Regra simples de admin para MVP:
// - Se localStorage.isAdmin === 'true', considera admin
// - OU se VITE_ADMIN_MODE === 'true', considera admin
// Você pode trocar essa lógica para integrar com Supabase Auth depois
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const localFlag = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
      const envFlag = import.meta.env.VITE_ADMIN_MODE === 'true';
      setIsAdmin(Boolean(localFlag || envFlag));
    } catch {
      setIsAdmin(false);
    }
  }, []);

  return isAdmin;
}


