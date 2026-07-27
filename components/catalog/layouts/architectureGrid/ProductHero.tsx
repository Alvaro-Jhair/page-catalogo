import StatementFrame from "./StatementFrame";
import type { ProductHeroData } from "@/data/schema";

export default function ProductHero({ data }: { data: ProductHeroData }) {
  return (
    <StatementFrame id={data.id} bgImage={data.bgImage} coord="A—02" title={data.name} pageNumber={data.pageNumber}>
      <p className="ag-statement-body">{data.type}</p>
    </StatementFrame>
  );
}
