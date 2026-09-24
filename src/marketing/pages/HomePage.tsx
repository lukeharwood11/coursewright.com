import { HomeAudience } from "../components/HomeAudience";
import { HomeCta } from "../components/HomeCta";
import { HomeHero } from "../components/HomeHero";
import { HomePatchwork } from "../components/HomePatchwork";
import { HomeValueProps } from "../components/HomeValueProps";

export function HomePage() {
  return (
    <main>
      <HomeHero />
      <HomePatchwork />
      <HomeValueProps />
      <HomeAudience />
      <HomeCta />
    </main>
  );
}
