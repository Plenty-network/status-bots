import axios from "axios";
import * as dotenv from "dotenv";
import { TezosToolkit } from "@taquito/taquito";

import PriceTicker from "./clients/PriceTicker";
import LockedTicker from "./clients/LockedTicker";
import VotesTicker from "./clients/VotesTicker";
import BlockListener from "./infrastructure/BlockListerner";

// Axios retry
axios.interceptors.response.use(undefined, async (error) => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return axios.request(error.config);
});

dotenv.config();
import { config } from "./config";

(async () => {
  const tezos = new TezosToolkit(config.rpcURL);
  const veInstance = await tezos.contract.at("KT18kkvmUoefkdok5mrjU6fxsm7xmumy1NEw");

  // Initialise clients
  const priceTickerClient = new PriceTicker(config);
  const lockedTickerClient = new LockedTicker(config);
  const votesTickerClient = new VotesTicker(config, veInstance);
  await priceTickerClient.init();
  await lockedTickerClient.init();
  await votesTickerClient.init();

  const blockListener = new BlockListener(config);
  blockListener.start(() => {
    priceTickerClient.providePrice();
    lockedTickerClient.provideLockedValue();
    votesTickerClient.provideVotesValue();
  });
})();
