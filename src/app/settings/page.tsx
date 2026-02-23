import SettingsContent from "@/components/SettingsContent";

export default async function SettingsPage() {
    // Artificial delay to demonstrate the partial loading screen
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return <SettingsContent />;
}
