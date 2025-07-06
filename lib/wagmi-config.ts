import { createConfig, http } from "wagmi"
import { base } from "wagmi/chains"
import { injected } from "wagmi/connectors"
import { farcasterFrame } from "@farcaster/frame-wagmi-connector"

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterFrame(),
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
})
