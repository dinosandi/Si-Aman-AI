import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GettingStarted } from "./warga/components/GettingStarted";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const hasStarted = localStorage.getItem("warga_has_started") === "true";
    if (hasStarted) {
      navigate({ to: "/warga", replace: true });
    }
  }, [navigate]);

  const handleStart = () => {
    localStorage.setItem("warga_has_started", "true");
    navigate({ to: "/warga" });
  };

  // Guard rendering
  const hasStarted = localStorage.getItem("warga_has_started") === "true";
  if (hasStarted) {
    return null;
  }

  return <GettingStarted onStart={handleStart} />;
}
