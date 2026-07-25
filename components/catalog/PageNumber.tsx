type PageNumberProps = {
  n: number;
  dark?: boolean;
};

/** Numeración de página, estilo lookbook. */
export default function PageNumber({ n, dark = false }: PageNumberProps) {
  return (
    <div className={`page-no${dark ? " dark" : ""}`}>
      - {n} -
    </div>
  );
}
