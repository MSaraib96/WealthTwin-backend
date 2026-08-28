import { ScenarioSimulator } from "@/components/shared/scenario-simulator";
import { PageHeader } from "@/components/shared/page-header";

export default function ScenariosPage() {
  return (
    <>
      <PageHeader
        title="Decision Simulator"
        description="Submit visible assumptions to the deterministic backend and return a result only when required financial inputs exist."
      />
      <ScenarioSimulator />
    </>
  );
}
