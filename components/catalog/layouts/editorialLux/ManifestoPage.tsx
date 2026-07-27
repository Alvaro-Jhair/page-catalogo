import StatementFrame from "./StatementFrame";
import type { ManifestoData } from "@/data/schema";

export default function ManifestoPage({ data }: { data: ManifestoData }) {
  return (
    <StatementFrame
      id="intro"
      bgImage={data.bgImage}
      kicker="Manifesto"
      title={data.heading}
      body={<p>{data.paragraph}</p>}
      pageNumber={data.pageNumber}
    />
  );
}
