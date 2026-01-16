import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.upsert({
    where: { name: "Engenharia de Software" },
    update: {},
    create: { name: "Engenharia de Software" },
  });

  const area = await prisma.area.upsert({
    where: { courseId_name: { courseId: course.id, name: "IC / Pesquisa" } },
    update: {},
    create: { name: "IC / Pesquisa", courseId: course.id },
  });

  const group = await prisma.researchGroup.create({
    data: { name: "Grupo Demo", areaId: area.id },
  });

  await prisma.research.createMany({
    data: [
      { title: "Pesquisa 1 (demo)", description: "Card de exemplo", groupId: group.id },
      { title: "Pesquisa 2 (demo)", description: "Outro card de exemplo", groupId: group.id },
    ],
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
