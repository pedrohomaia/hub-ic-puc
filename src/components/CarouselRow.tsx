import ResearchCard from "@/components/ResearchCard";
import type { ResearchCardVM } from "@/lib/research.repo";

export default function CarouselRow({
  title,
  items,
}: {
  title: string;
  items: ResearchCardVM[];
}) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2 style={{ margin: "12px 0" }}>{title}</h2>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {items.map((it) => (
          <ResearchCard key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
