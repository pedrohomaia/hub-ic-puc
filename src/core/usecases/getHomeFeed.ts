import {
  listResearchMyCourse,
  listResearchNew,
  listResearchOtherAreas,
  type ResearchCardVM,
} from "@/lib/research.repo";

export type HomeFeed = {
  myCourseTitle: string;
  myCourse: ResearchCardVM[];
  otherAreas: ResearchCardVM[];
  newest: ResearchCardVM[];
};

export async function getHomeFeed(userCourseId?: string | null): Promise<HomeFeed> {
  const newest = await listResearchNew(12);

  if (!userCourseId) {
    return {
      myCourseTitle: "Recomendadas",
      myCourse: newest,
      otherAreas: newest,
      newest,
    };
  }

  const [myCourse, otherAreas] = await Promise.all([
    listResearchMyCourse(userCourseId, 12),
    listResearchOtherAreas(userCourseId, 12),
  ]);

  return { myCourseTitle: "Meu Curso", myCourse, otherAreas, newest };
}
