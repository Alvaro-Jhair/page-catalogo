import StatementFrame from "./StatementFrame";
import type { ManifestoData } from "@/data/schema";

export default function ManifestoPage({ data }: { data: ManifestoData }) {
  return (
    <StatementFrame id="intro" bgImage={data.bgImage} tag="ABOUT" title={data.heading} pageNumber={data.pageNumber}>
      <p className="ik-statement-body">{data.paragraph}</p>
    </StatementFrame>
  );
}
