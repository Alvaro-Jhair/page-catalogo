import StatementFrame from "./StatementFrame";
import type { ManifestoData } from "@/data/schema";

export default function ManifestoPage({ data }: { data: ManifestoData }) {
  return (
    <StatementFrame id="intro" bgImage={data.bgImage} coord="A—01" title={data.heading} pageNumber={data.pageNumber}>
      <p className="ag-statement-body">{data.paragraph}</p>
    </StatementFrame>
  );
}
