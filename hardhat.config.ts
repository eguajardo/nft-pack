import { HardhatUserConfig } from "hardhat/types";

import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.3", settings: {} }],
  },
  networks: {
    ropsten: {
      url: "https://ropsten.infura.io/v3/ffb37bda4b4f4641923589a663bdee8f",
      accounts: [process.env.ROPSTEN_ACCOUNT_1!, process.env.ROPSTEN_ACCOUNT_2!, process.env.ROPSTEN_ACCOUNT_3!, process.env.ROPSTEN_ACCOUNT_4!, process.env.ROPSTEN_ACCOUNT_5!]
    }
  }
};
export default config;