import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../../lib/db"; // ajuste se seu caminho estiver diferente
import { GET } from "./route";

describe("GET /api/leaderboard", () => {
  beforeAll(async () => {
    // limpa o necessário (ordem FK)
    await prisma.userBadge.deleteMany();
    await prisma.researchVerifyToken.deleteMany(); // opcional, mas seguro
    await prisma.completion.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.research.deleteMany();
    await prisma.researchGroup.deleteMany();
    await prisma.area.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const u1 = await prisma.user.create({ data: { email: "u1@test.dev", name: "U1" } });
    const u2 = await prisma.user.create({ data: { email: "u2@test.dev", name: "U2" } });

    const course = await prisma.course.create({ data: { name: "Curso LB" } });
    const area = await prisma.area.create({ data: { name: "Area LB", courseId: course.id } });
    const group = await prisma.researchGroup.create({ data: { name: "Grupo LB", areaId: area.id } });

    const r = await prisma.research.create({ data: { title: "Pesquisa LB", groupId: group.id } });

    // completions no período (week)
    await prisma.completion.createMany({
      data: [
        { userId: u1.id, researchId: r.id, type: "VERIFIED", pointsAwarded: 30 },
        { userId: u1.id, researchId: r.id, type: "SIMPLE", pointsAwarded: 5 },
        { userId: u2.id, researchId: r.id, type: "VERIFIED", pointsAwarded: 10 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("retorna 200 e ok=true", async () => {
    const req = new Request("http://localhost/api/leaderboard?period=week");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.items)).toBe(true);
  });

  it("ordena por soma de pointsAwarded desc", async () => {
    const req = new Request("http://localhost/api/leaderboard?period=week");
    const res = await GET(req);
    const json = await res.json();

    expect(json.items[0].points).toBeGreaterThanOrEqual(json.items[1].points);
  });
});
