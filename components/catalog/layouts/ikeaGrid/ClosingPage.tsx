import StatementFrame from "./StatementFrame";
import type { ClosingData } from "@/data/schema";

type ClosingPageProps = {
  data: ClosingData;
  pdfHref?: string;
};

export default function ClosingPage({ data, pdfHref }: ClosingPageProps) {
  return (
    <StatementFrame bgImage={data.bgImage} tag={data.line1} title={data.title} pageNumber={data.pageNumber}>
      <p className="ik-statement-body">{data.line2}</p>
      {pdfHref && (
        <a href={pdfHref} download className="pdf-download-link ik-statement-link">
          Descargar catálogo en PDF
        </a>
      )}
    </StatementFrame>
  );
}
