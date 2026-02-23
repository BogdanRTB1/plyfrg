
export default async function Home() {
  // Artificial delay to show loading screen
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return <HomeContent />;
}

import HomeContent from "@/components/HomeContent";
