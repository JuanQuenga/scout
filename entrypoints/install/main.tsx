import { createRoot } from "react-dom/client";
import FeaturesPage from "../../src/components/landing/InstallPage";

const container = document.getElementById("app");
if (!container) throw new Error("Failed to find the app element");
const root = createRoot(container);
root.render(<FeaturesPage />);
