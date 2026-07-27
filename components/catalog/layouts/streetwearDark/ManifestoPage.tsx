import StatementFrame from "./StatementFrame";
import type { ManifestoData } from "@/data/schema";

export default function ManifestoPage({ data }: { data: ManifestoData }) {
  return (
    <StatementFrame id="intro" bgImage={data.bgImage} tag="ZINE.01" title={data.heading} pageNumber={data.pageNumber}>
      <p className="sw-statement-body">{data.paragraph}</p>
    </StatementFrame>
  );
}
