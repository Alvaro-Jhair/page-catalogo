import StatementFrame from "./StatementFrame";
import type { ChapterHero as ChapterHeroData } from "@/data/schema";

export default function ChapterHero({ data }: { data: ChapterHeroData }) {
  return (
    <StatementFrame id={data.id} bgImage={data.bgImage} kicker={data.name} title={data.label} pageNumber={data.pageNumber} />
  );
}
