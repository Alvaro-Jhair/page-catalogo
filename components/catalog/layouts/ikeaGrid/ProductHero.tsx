import StatementFrame from "./StatementFrame";
import type { ProductHeroData } from "@/data/schema";

export default function ProductHero({ data }: { data: ProductHeroData }) {
  return (
    <StatementFrame id={data.id} bgImage={data.bgImage} tag="RANGE" title={data.name} pageNumber={data.pageNumber}>
      <p className="ik-statement-body">{data.type}</p>
    </StatementFrame>
  );
}
