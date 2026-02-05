import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "./db";

import {
  generateVerifyTokensForResearch,
  verifyTokenAndCreateVerifiedCompletion,
} from "@/lib/researchTokens.repo";

import { AppError } from "@/lib/appError";

describe("researchTokens.repo", () => {
  let userId: string;
  let groupId: string;
  let researchId: string;

  beforeAll(async () => {
    // limpa (ordem respeita FK)
    await prisma.userBadge.deleteMany();
    await prisma.researchVerifyToken.deleteMany();
    await prisma.completion.deleteMany();
    await prisma.research.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.researchGroup.deleteMany();

    // ✅ faltava limpar isso (Course.name é @unique)
    await prisma.area.deleteMany();
    await prisma.course.deleteMany();

    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { email: "admin@test.dev", name: "Admin" },
      select: { id: true },
    });
    userId = user.id;

    const course = await prisma.course.create({
      data: { name: "Curso Teste" },
      select: { id: true },
    });

    const area = await prisma.area.create({
      data: { name: "Área Teste", courseId: course.id },
      select: { id: true },
    });

    const group = await prisma.researchGroup.create({
      data: { name: "Grupo Teste", areaId: area.id },
      select: { id: true },
    });
    groupId = group.id;

    await prisma.groupMember.create({
      data: { userId, groupId, role: "ADMIN" },
    });

    const research = await prisma.research.create({
      data: { title: "Pesquisa Teste", groupId },
      select: { id: true },
    });
    researchId = research.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("ok: token válido cria completion VERIFIED", async () => {
    const gen = await generateVerifyTokensForResearch(userId, researchId, 1);
    const token = gen.tokens[0];

    const completion = await verifyTokenAndCreateVerifiedCompletion(userId, researchId, token);

    expect(completion.type).toBe("VERIFIED");
    expect(completion.pointsAwarded).toBeGreaterThan(0);

    const count = await prisma.completion.count({ where: { userId, researchId } });
    expect(count).toBe(1);
  });

  it("token usado -> TOKEN_USED", async () => {
    // ✅ usa um usuário diferente pra não bater no @@unique (ALREADY_COMPLETED)
    const user2 = await prisma.user.create({
      data: { email: `user2+${Date.now()}@test.dev`, name: "User 2" },
      select: { id: true },
    });

    const gen = await generateVerifyTokensForResearch(userId, researchId, 1);
    const token = gen.tokens[0];

    // 1ª vez: ok
    await verifyTokenAndCreateVerifiedCompletion(user2.id, researchId, token);

    // 2ª vez: mesmo token -> TOKEN_USED
    try {
      await verifyTokenAndCreateVerifiedCompletion(user2.id, researchId, token);
      throw new Error("expected to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      const err = e as AppError;
      expect(err.code).toBe("TOKEN_USED");
      expect(err.status).toBe(409);
    }
  });

  it("token inválido -> TOKEN_INVALID", async () => {
    await expect(
      verifyTokenAndCreateVerifiedCompletion(userId, researchId, "nao-existe")
    ).rejects.toMatchObject({ code: "TOKEN_INVALID" });
  });
});
