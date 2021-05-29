import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.3", settings: {} }],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc-mumbai.maticvigil.com"
      }
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.MUMBAI_ACCOUNT_1!, process.env.MUMBAI_ACCOUNT_2!, process.env.MUMBAI_ACCOUNT_3!, process.env.MUMBAI_ACCOUNT_4!, process.env.MUMBAI_ACCOUNT_5!]
    }
  }
};
export default config;