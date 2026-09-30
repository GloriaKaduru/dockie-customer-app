import { notFound } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { STEPS, type Step } from "@/components/onboarding/steps";

export const metadata = { title: "Get started" };

// /onboarding/signup → verify-email → verify-phone → account-type → business → team → walkthrough
export default async function OnboardingPage({ params }: PageProps<"/onboarding/[step]">) {
  const { step } = await params;
  if (!STEPS.includes(step as Step)) notFound();
  return <OnboardingFlow step={step as Step} />;
}
