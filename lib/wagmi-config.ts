import { http, createConfig } from "wagmi";
import { avalanche, avalancheFuji } from "viem/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "" }),
  ],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
