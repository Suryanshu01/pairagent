// src/config/skale.ts — SKALE Base Sepolia Chain Configuration
// SKALE Base Sepolia is the first SKALE Expand deployment, sourcing liquidity from Base Sepolia.
// It supports native EIP-3009 tokens (USDC, USDT, WBTC, WETH) for gasless payments.
// This is perfect for x402 micropayments where gas costs would exceed the payment amount.

export const SKALE_BASE_SEPOLIA = {
  id: 324705682,
  name: "SKALE Base Sepolia",
  network: "skale-base-sepolia",
  caip2: "eip155:324705682",
  rpcUrls: {
    default: {
      http: [
        "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "SKALE Explorer",
      url: "https://base-sepolia-testnet.explorer.skalenodes.com",
    },
  },
  nativeCurrency: {
    name: "sFUEL",
    symbol: "sFUEL",
    decimals: 18,
  },
  // SKALE is GASLESS — sFUEL is free and auto-distributed
  gasless: true,
  contracts: {
    // EIP-3009 compatible USDC on SKALE Base Sepolia
    USDC: "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD",
  },
} as const;

// SKALE BITE Protocol Configuration
// BITE = Blockchain Integrated Threshold Encryption
// Encrypts transaction data pre-mempool, decrypts post-finalization
// This provides privacy for IoT device payments — no frontrunning, no surveillance
export const BITE_CONFIG = {
  enabled: true,
  encryptionMethod: "threshold",
  description:
    "Threshold encryption protects payment metadata. Transaction inputs are encrypted before entering the mempool and only decrypted after block finalization. This prevents frontrunning and protects device payment patterns from surveillance.",
  // In production, BITE encryption happens at the RPC level
  // The SKALE node handles encryption/decryption transparently
  rpcMethod: "bite_getDecryptedTransactionData",
};

// Network selection helper
export function getNetworkConfig(preferSkale: boolean = true) {
  if (preferSkale) {
    return {
      chainId: SKALE_BASE_SEPOLIA.id,
      rpcUrl: SKALE_BASE_SEPOLIA.rpcUrls.default.http[0],
      usdcContract: SKALE_BASE_SEPOLIA.contracts.USDC,
      caip2: SKALE_BASE_SEPOLIA.caip2,
      gasless: true,
      biteEnabled: BITE_CONFIG.enabled,
    };
  }
  // Fallback to standard Base Sepolia
  return {
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    usdcContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    caip2: "eip155:84532",
    gasless: false,
    biteEnabled: false,
  };
}
