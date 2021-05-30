import { HardhatUserConfig } from "hardhat/types";

import { task } from "hardhat/config";
import { ContractFactory } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import "@nomiclabs/hardhat-waffle";

import * as dotenv from "dotenv";

dotenv.config();

task("vrf-callback", "Mocks a VRF callback")
  .addParam("coordinator", "VRF coordinator contract address")
  .addParam("request", "Request ID")
  .addParam("tokenpack", "TokanPack contract address")
  .addParam("randomness", "Random number to send in mocked callback")
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners();

    const vrfCoordinatorFactory: ContractFactory =
      await hre.ethers.getContractFactory("VRFCoordinatorMock", {
        signer: signers[0],
      });
    const vrfCoordinator = vrfCoordinatorFactory.attach(args.coordinator);

    const vrfTx: TransactionResponse =
      await vrfCoordinator.callBackWithRandomness(
        args.request,
        parseInt(args.randomness),
        args.tokenpack,
        { gasLimit: 230000 }
      );

    console.log("Transaction:", await vrfTx.wait());
  });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.3", settings: {} }],
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.MUMBAI_NODE_URL || "https://rpc-mumbai.maticvigil.com",
      },
    },
    mumbai: {
      url: process.env.MUMBAI_NODE_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: [
        process.env.MUMBAI_ACCOUNT_1!,
        process.env.MUMBAI_ACCOUNT_2!,
        process.env.MUMBAI_ACCOUNT_3!,
        process.env.MUMBAI_ACCOUNT_4!,
        process.env.MUMBAI_ACCOUNT_5!,
      ],
    },
  },
};
export default config;
