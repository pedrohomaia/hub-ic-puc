import CarouselRow from "@/components/CarouselRow";
import { getHomeFeed } from "@/core/usecases/getHomeFeed";

export default async function HomePage() {
  const feed = await getHomeFeed(null);

  return (
    <main style={{ padding: 24 }}>
      <h1>Hub de Pesquisas</h1>
      <CarouselRow title={feed.myCourseTitle} items={feed.myCourse} />
      <CarouselRow title="Outras Áreas" items={feed.otherAreas} />
      <CarouselRow title="Novas" items={feed.newest} />
    </main>
  );
}