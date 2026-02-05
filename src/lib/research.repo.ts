import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ResearchCardVM = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  groupName: string;
  areaName: string;
  courseName: string;
};

type ResearchWithJoins = Prisma.ResearchGetPayload<{
  include: { group: { include: { area: { include: { course: true } } } } };
}>;

function toCardVM(r: ResearchWithJoins): ResearchCardVM {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    createdAt: r.createdAt,
    groupName: r.group.name,
    areaName: r.group.area.name,
    courseName: r.group.area.course.name,
  };
}

const includeJoins = {
  group: { include: { area: { include: { course: true } } } },
} satisfies Prisma.ResearchInclude;

// ===== FEEDS/LISTS =====

export async function listResearchNew(limit = 12): Promise<ResearchCardVM[]> {
  const rows = await prisma.research.findMany({
    where: { isHidden: false, isApproved: true }, // ✅ US1.6
    orderBy: { createdAt: "desc" },
    take: limit,
    include: includeJoins,
  });

  return rows.map((r) => toCardVM(r as ResearchWithJoins));
}

export async function listResearchMyCourse(
  courseId: string,
  limit = 12
): Promise<ResearchCardVM[]> {
  const rows = await prisma.research.findMany({
    where: { isHidden: false, isApproved: true, group: { area: { courseId } } }, // ✅ US1.6
    orderBy: { createdAt: "desc" },
    take: limit,
    include: includeJoins,
  });

  return rows.map((r) => toCardVM(r as ResearchWithJoins));
}

export async function listResearchOtherAreas(
  courseId: string,
  limit = 12
): Promise<ResearchCardVM[]> {
  const rows = await prisma.research.findMany({
    where: {
      isHidden: false,
      isApproved: true, // ✅ US1.6
      NOT: { group: { area: { courseId } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: includeJoins,
  });

  return rows.map((r) => toCardVM(r as ResearchWithJoins));
}

export async function getResearchById(researchId: string) {
  const id = String(researchId ?? "").trim();
  if (!id) return null;

  return prisma.research.findFirst({
    where: { id },
    include: {
      group: { include: { area: { include: { course: true } } } },
    },
  });
}

// ===== CRUD MVP (US1.4) =====

export type ResearchPayload = {
  title: string;
  description?: string | null;
};

export type ResearchUpdatePayload = {
  title?: string;
  description?: string | null;
};

// CREATE: exige title; description opcional
export function validateResearchPayload(input: unknown): ResearchPayload {
  const obj = (input ?? {}) as Record<string, unknown>;

  const titleRaw = obj["title"];
  const descRaw = obj["description"];

  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";

  const description =
    typeof descRaw === "string"
      ? descRaw.trim()
      : descRaw === null
      ? null
      : undefined;

  if (!title || title.length < 3) {
    throw new Error("INVALID_TITLE");
  }

  return {
    title,
    ...(description !== undefined ? { description } : {}),
  };
}

// PATCH: parcial; rejeita patch vazio
export function validateResearchUpdatePayload(
  input: unknown
): ResearchUpdatePayload {
  const obj = (input ?? {}) as Record<string, unknown>;

  const titleRaw = obj["title"];
  const descRaw = obj["description"];

  const title = typeof titleRaw === "string" ? titleRaw.trim() : undefined;

  const description =
    typeof descRaw === "string"
      ? descRaw.trim()
      : descRaw === null
      ? null
      : undefined;

  const hasTitle = title !== undefined;
  const hasDescription = description !== undefined;

  if (!hasTitle && !hasDescription) {
    throw new Error("INVALID_EMPTY_PATCH");
  }

  if (hasTitle && (!title || title.length < 3)) {
    throw new Error("INVALID_TITLE");
  }

  return {
    ...(hasTitle ? { title } : {}),
    ...(hasDescription ? { description } : {}),
  };
}

export async function createResearch(
  userId: string,
  groupId: string,
  payload: ResearchPayload
) {
  const uid = String(userId ?? "").trim();
  if (!uid) throw new Error("MISSING_USER_ID");

  const gid = String(groupId ?? "").trim();
  if (!gid) throw new Error("MISSING_GROUP_ID");

  // ✅ garante que quem cria vira ADMIN do grupo
  return prisma.$transaction(async (tx) => {
    await tx.groupMember.upsert({
      where: { userId_groupId: { userId: uid, groupId: gid } },
      update: { role: "ADMIN" },
      create: { userId: uid, groupId: gid, role: "ADMIN" },
    });

    return tx.research.create({
      data: {
        groupId: gid,
        title: payload.title,
        description: payload.description ?? null,
        isHidden: false,
        isApproved: false, // nasce pendente
      },
    });
  });
}


export async function updateResearch(
  _userId: string,
  researchId: string,
  patch: ResearchUpdatePayload
) {
  const id = String(researchId ?? "").trim();
  if (!id) throw new Error("MISSING_ID");

  const data: Prisma.ResearchUpdateInput = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.description !== undefined) data.description = patch.description;

  return prisma.research.update({
    where: { id },
    data,
  });
}

// MVP: archive = isHidden=true
export async function hideResearch(researchId: string) {
  const id = String(researchId ?? "").trim();
  if (!id) throw new Error("MISSING_ID");

  return prisma.research.update({
    where: { id },
    data: { isHidden: true },
  });
}

// ===== GROUP PAGES (US1.4 UI + US1.5) =====

export async function getGroupById(groupId: string) {
  const id = String(groupId ?? "").trim();
  if (!id) return null;

  return prisma.researchGroup.findFirst({
    where: { id },
    include: { area: { include: { course: true } } },
  });
}

export async function listResearchByGroup(groupId: string) {
  const gid = String(groupId ?? "").trim();
  if (!gid) return [];

  return prisma.research.findMany({
    where: { groupId: gid, isHidden: false, isApproved: true }, // ✅ US1.6
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      groupId: true,
      isHidden: true,
      isApproved: true,
    },
  });
}
// ===== MODERATION (US1.6 UI) =====

export type PendingResearchVM = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  groupId: string;
  isApproved: boolean;
  isHidden: boolean;
};

export async function listPendingResearch(limit = 80): Promise<PendingResearchVM[]> {
  const rows = await prisma.research.findMany({
    where: { isHidden: false, isApproved: false }, // pendentes
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      groupId: true,
      isHidden: true,
      isApproved: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    createdAt: r.createdAt,
    groupId: r.groupId,
    isHidden: r.isHidden,
    isApproved: r.isApproved,
  }));
}

export async function moderateResearch(
  researchId: string,
  action: "APPROVE" | "HIDE"
) {
  const id = String(researchId ?? "").trim();
  if (!id) throw new Error("MISSING_ID");

  if (action === "APPROVE") {
  return prisma.research.update({
    where: { id },
    data: { isApproved: true, isHidden: false }, // ✅ importante
    select: { id: true, isApproved: true, isHidden: true },
  });
}



  if (action === "HIDE") {
    return prisma.research.update({
      where: { id },
      data: { isHidden: true },
      select: { id: true, isApproved: true, isHidden: true },
    });
  }

  throw new Error("INVALID_ACTION");
}
