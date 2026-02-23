import HistoryContent from "@/components/HistoryContent";

export default async function HistoryPage() {
    // Artificial delay to show loading screen
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return <HistoryContent />;
}
