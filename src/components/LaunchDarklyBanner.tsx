import { useFlags } from 'launchdarkly-react-client-sdk';

// LaunchDarkly first-flag test banner (staged, uncommitted).
// Reads the `hello-world` flag — camelCase `helloWorld` by default in the
// React SDK (provider in main.tsx does not disable camelCase).
// When the flag is on, a small banner shows. When it is off, missing, or
// the app renders without a LaunchDarkly provider, this renders nothing
// (useFlags defaults to an empty flag set outside a provider), so the app
// never breaks on a missing flag.
export default function LaunchDarklyBanner() {
  const flags = useFlags() as { helloWorld?: boolean };
  if (!flags.helloWorld) {
    return null;
  }
  return (
    <div
      role="status"
      className="w-full px-4 py-2 text-center text-[12px] font-bold font-mono-code uppercase tracking-wider bg-teal-600 text-white print:hidden"
    >
      LaunchDarkly first flag is ON — hello-world banner
    </div>
  );
}
