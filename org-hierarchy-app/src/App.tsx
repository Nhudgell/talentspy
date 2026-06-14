import { useStore } from "./store/useStore";
import { UploadScreen } from "./components/upload/UploadScreen";
import { MappingScreen } from "./components/mapping/MappingScreen";
import { Workbench } from "./components/workbench/Workbench";

export default function App() {
  const step = useStore((s) => s.step);
  if (step === "upload") return <UploadScreen />;
  if (step === "mapping") return <MappingScreen />;
  return <Workbench />;
}
