import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <SignIn
        forceRedirectUrl="/welcome"
        fallbackRedirectUrl="/welcome"
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
