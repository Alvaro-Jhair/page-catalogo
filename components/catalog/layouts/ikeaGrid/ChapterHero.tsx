import StatementFrame from "./StatementFrame";
import type { ChapterHero as ChapterHeroData } from "@/data/schema";

export default function ChapterHero({ data }: { data: ChapterHeroData }) {
  return (
    <StatementFrame id={data.id} bgImage={data.bgImage} tag="SERIES" title={data.label} pageNumber={data.pageNumber}>
      <p className="ik-statement-body">{data.name}</p>
    </StatementFrame>
  );
}
