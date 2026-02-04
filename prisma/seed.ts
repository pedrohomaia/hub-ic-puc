import "dotenv/config";
import { PrismaClient, BadgeCode, CompletionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SIMPLE_POINTS = 10;
const VERIFIED_POINTS = 30;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function bronzeCodesFromCount(total: number) {
  const out: BadgeCode[] = [];
  if (total >= 1) out.push(BadgeCode.BRONZE_1);
  if (total >= 5) out.push(BadgeCode.BRONZE_2);
  if (total >= 15) out.push(BadgeCode.BRONZE_3);
  return out;
}

async function main() {
  // ✅ Course
  const course = await prisma.course.upsert({
    where: { name: "Engenharia de Software" },
    update: {},
    create: { name: "Engenharia de Software" },
    select: { id: true },
  });

  // ✅ Area (unique composto courseId + name)
  const area = await prisma.area.upsert({
    where: { courseId_name: { courseId: course.id, name: "IC / Pesquisa" } },
    update: {},
    create: { courseId: course.id, name: "IC / Pesquisa" },
    select: { id: true },
  });

  // ✅ ResearchGroup
  let group = await prisma.researchGroup.findFirst({
    where: { areaId: area.id, name: "Grupo Demo" },
    select: { id: true },
  });

  if (!group) {
    group = await prisma.researchGroup.create({
      data: { name: "Grupo Demo", areaId: area.id },
      select: { id: true },
    });
  }

  // ✅ Admin
  const adminEmail = (process.env.DEV_AUTH_EMAIL ?? "admin@local.dev").trim();
  const adminName = (process.env.DEV_AUTH_NAME ?? "Admin Local").trim();

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName },
    create: { email: adminEmail, name: adminName },
    select: { id: true, email: true, name: true },
  });

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: admin.id, groupId: group.id } },
    update: { role: "ADMIN" },
    create: { userId: admin.id, groupId: group.id, role: "ADMIN" },
  });

  // ✅ Research demo (aprovada e visível)
  const existingResearch = await prisma.research.findFirst({
    where: { groupId: group.id, title: "Pesquisa Demo" },
    select: { id: true },
  });

  const research = existingResearch
    ? await prisma.research.update({
        where: { id: existingResearch.id },
        data: {
          isHidden: false,
          isApproved: true,
          description: "Pesquisa seed para testar verify tokens.",
        },
        select: { id: true },
      })
    : await prisma.research.create({
        data: {
          title: "Pesquisa Demo",
          groupId: group.id,
          description: "Pesquisa seed para testar verify tokens.",
          isHidden: false,
          isApproved: true,
        },
        select: { id: true },
      });

  // ✅ Criar usuários fake pra ranking
  const players = [
    { email: "user1@local.dev", name: "User 1" },
    { email: "user2@local.dev", name: "User 2" },
    { email: "user3@local.dev", name: "User 3" },
    { email: "user4@local.dev", name: "User 4" },
    { email: "user5@local.dev", name: "User 5" },
  ];

  const users = [];
  for (const p of players) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name },
      create: { email: p.email, name: p.name },
      select: { id: true, email: true, name: true },
    });
    users.push(u);

    // Só pra garantir: membro normal do grupo (não-admin)
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: u.id, groupId: group.id } },
      update: { role: "MEMBER" },
      create: { userId: u.id, groupId: group.id, role: "MEMBER" },
    });
  }

  // ✅ Limpar completions antigas desses usuários (pra seed ficar determinístico)
  const seedUserIds = [admin.id, ...users.map((u) => u.id)];
  await prisma.completion.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.userBadge.deleteMany({ where: { userId: { in: seedUserIds } } });

  // ✅ Criar completions com datas variadas (ranking muda nos filtros)
  // Admin: 1 VERIFIED (2 dias atrás) + 2 SIMPLE (10 e 25 dias)
  await prisma.completion.createMany({
    data: [
      { userId: admin.id, researchId: research.id, type: CompletionType.VERIFIED, pointsAwarded: VERIFIED_POINTS, createdAt: daysAgo(2) },
      { userId: admin.id, researchId: research.id, type: CompletionType.SIMPLE, pointsAwarded: SIMPLE_POINTS, createdAt: daysAgo(10) },
      // ⚠️ só pode 1 SIMPLE por user+research (unique). Então este abaixo é só exemplo se você tiver outra research.
      // Se você só tem 1 research, comente esta linha:
      // { userId: admin.id, researchId: research.id, type: CompletionType.SIMPLE, pointsAwarded: SIMPLE_POINTS, createdAt: daysAgo(25) },
    ],
    skipDuplicates: true,
  });

  // Players:
  // user1: 1 VERIFIED (5 dias) => aparece na semana
  // user2: 1 SIMPLE (3 dias)  => aparece na semana
  // user3: 1 SIMPLE (20 dias) => aparece em 30d, talvez não na semana
  // user4: 1 SIMPLE (45 dias) => não aparece em 30d nem semana, mas pode não entrar no mês atual dependendo do mês
  // user5: 1 VERIFIED (32 dias) => fora de 30d, mas pode cair no mês atual dependendo da data
  const [u1, u2, u3, u4, u5] = users;

  await prisma.completion.createMany({
    data: [
      { userId: u1.id, researchId: research.id, type: CompletionType.VERIFIED, pointsAwarded: VERIFIED_POINTS, createdAt: daysAgo(5) },
      { userId: u2.id, researchId: research.id, type: CompletionType.SIMPLE, pointsAwarded: SIMPLE_POINTS, createdAt: daysAgo(3) },
      { userId: u3.id, researchId: research.id, type: CompletionType.SIMPLE, pointsAwarded: SIMPLE_POINTS, createdAt: daysAgo(20) },
      { userId: u4.id, researchId: research.id, type: CompletionType.SIMPLE, pointsAwarded: SIMPLE_POINTS, createdAt: daysAgo(45) },
      { userId: u5.id, researchId: research.id, type: CompletionType.VERIFIED, pointsAwarded: VERIFIED_POINTS, createdAt: daysAgo(32) },
    ],
    skipDuplicates: true,
  });

  // ✅ Recalcular points do User com base nas completions
  for (const u of seedUserIds) {
    const agg = await prisma.completion.aggregate({
      where: { userId: u },
      _sum: { pointsAwarded: true },
      _count: { id: true },
    });

    const totalPoints = agg._sum.pointsAwarded ?? 0;
    const totalCompletions = agg._count.id ?? 0;

    await prisma.user.update({
      where: { id: u },
      data: { points: totalPoints },
    });

    // ✅ Badges bronze por total completions
    const bronze = bronzeCodesFromCount(totalCompletions);
    for (const code of bronze) {
      await prisma.userBadge.upsert({
        where: { userId_code: { userId: u, code } },
        update: {},
        create: { userId: u, code },
      });
    }

    // ✅ VERIFIED_1 se tiver completion VERIFIED
    const hasVerified = await prisma.completion.findFirst({
      where: { userId: u, type: CompletionType.VERIFIED },
      select: { id: true },
    });

    if (hasVerified) {
      await prisma.userBadge.upsert({
        where: { userId_code: { userId: u, code: BadgeCode.VERIFIED_1 } },
        update: {},
        create: { userId: u, code: BadgeCode.VERIFIED_1 },
      });
    }
  }

  console.log("Seed OK", {
    adminEmail: admin.email,
    adminId: admin.id,
    groupId: group.id,
    areaId: area.id,
    courseId: course.id,
    researchId: research.id,
    users: users.map((u) => u.email),
  });

  console.log("Dica: teste /leaderboard?period=week e ?period=30d e ?period=month");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
