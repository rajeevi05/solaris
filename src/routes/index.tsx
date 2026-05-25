import { createFileRoute } from "@tanstack/react-router";
import { SolarExperience } from "@/components/solar/SolarExperience";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Solaris — A Cinematic Journey Through the Solar System" },
      {
        name: "description",
        content:
          "Travel from the Sun to the edges of the Kuiper Belt in an interactive 3D documentary of our Solar System.",
      },
    ],
  }),
});

function Index() {
  return <SolarExperience />;
}
