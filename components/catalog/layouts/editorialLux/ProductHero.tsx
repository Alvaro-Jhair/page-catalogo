import StatementFrame from "./StatementFrame";
import type { ProductHeroData } from "@/data/schema";

export default function ProductHero({ data }: { data: ProductHeroData }) {
  return (
    <StatementFrame
      id={data.id}
      bgImage={data.bgImage}
      kicker="The Collection"
      title={data.name}
      body={<p className="ed-statement-tag">{data.type}</p>}
      pageNumber={data.pageNumber}
    />
  );
}
