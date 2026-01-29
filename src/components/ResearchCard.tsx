import Link from "next/link";
import type { ResearchCardVM } from "@/lib/research.repo";

export default function ResearchCard({ item }: { item: ResearchCardVM }) {
  return (
    <Link
      href={`/research/${item.id}`}
      style={{
        minWidth: 260,
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
        {item.courseName} • {item.areaName} • {item.groupName}
      </div>
      <div style={{ fontSize: 14, opacity: 0.9 }}>
        {(item.description ?? "").slice(0, 120) || "Sem descrição"}
        {(item.description ?? "").length > 120 ? "..." : ""}
      </div>
    </Link>
  );
}

