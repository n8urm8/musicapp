import WalletConnect from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

export const providerOptions = {
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
      appName: "Music NFT Demo", // Required
      infuraId: process.env.INFURA_KEY // Required unless you provide a JSON RPC url; see `rpc` below
    }
  },
  walletconnect: {
    package: WalletConnect, // required
    options: {
      infuraId: process.env.INFURA_KEY, // required
      rpc: {
        137: "https://polygon-rpc.com",
        31337: "http://localhost:8545",
        80001: "https://polygon-mumbai.g.alchemy.com/v2/v9tZMbd55QG9TpLMqrkDc1dQIzgZazV6",
      }
    }
  }
};
