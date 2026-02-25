import { useEffect } from "react";
import { getLoginUrl } from "@/const";

export default function LoginRedirect() {
  useEffect(() => {
    const loginUrl = getLoginUrl();

    if (!loginUrl || loginUrl === "/login") {
      window.location.replace("/");
      return;
    }

    window.location.replace(loginUrl);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
    </div>
  );
}
