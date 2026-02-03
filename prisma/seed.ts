import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

  // ✅ ResearchGroup (não cria duplicado)
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

  // ✅ user admin + membership ADMIN
  const adminEmail = (process.env.DEV_AUTH_EMAIL ?? "admin@local.dev").trim();
  const adminName = (process.env.DEV_AUTH_NAME ?? "Admin Local").trim();

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName },
    create: { email: adminEmail, name: adminName },
    select: { id: true, email: true },
  });

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: admin.id, groupId: group.id } },
    update: { role: "ADMIN" },
    create: { userId: admin.id, groupId: group.id, role: "ADMIN" },
  });

  // ✅ Research demo (garante isApproved=true pra aparecer no /research)
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
          isApproved: true, // ✅ AQUI
        },
        select: { id: true },
      });

  console.log("Seed OK", {
    adminEmail: admin.email,
    adminId: admin.id,
    groupId: group.id,
    areaId: area.id,
    courseId: course.id,
    researchId: research.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // importante no Windows pra não travar
  });
