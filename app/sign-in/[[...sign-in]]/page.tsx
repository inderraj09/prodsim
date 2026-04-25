import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const target =
    ref && ref.length > 0
      ? `/welcome?ref=${encodeURIComponent(ref)}`
      : "/welcome";
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <SignIn
        forceRedirectUrl={target}
        fallbackRedirectUrl={target}
        appearance={{
          variables: {
            colorBackground: "oklch(0.205 0 0)",
            colorText: "oklch(0.985 0 0)",
            colorPrimary: "oklch(0.922 0 0)",
            colorInputBackground: "oklch(0.269 0 0)",
            colorInputText: "oklch(0.985 0 0)",
          },
        }}
      />
    </main>
  );
}
