import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user: current }
      } = await supabase.auth.getUser();
      if (active) setUser(current);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return user;
}
