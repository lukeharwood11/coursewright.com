import { HomeCta } from "../components/HomeCta";
import { HomeHero } from "../components/HomeHero";
import { HomePatchwork } from "../components/HomePatchwork";
import { HomeValueProps } from "../components/HomeValueProps";

export function HomePage() {
  return (
    <main>
      <HomeHero />
      <HomeValueProps />
      <HomePatchwork />
      <HomeCta />
    </main>
  );
}
