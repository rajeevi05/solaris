import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SolarExperience } from "@/components/solar/SolarExperience";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SolarExperience />
  </StrictMode>,
);
