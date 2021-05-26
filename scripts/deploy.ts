import { Contract, ContractFactory } from "@ethersproject/contracts";
import { artifacts, ethers, network } from "hardhat";

async function main() {
  console.log("Deploying to network:", network.name);

  let vrfCoordinatorAddress: string | undefined =
    process.env[`${network.name.toUpperCase()}_CHAINLINK_VRFCOORDINATOR`];
  let linkAddress: string | undefined =
    process.env[`${network.name.toUpperCase()}_CHAINLINK_LINK_CONTRACT`];
  let keyHash: string | undefined =
    process.env[`${network.name.toUpperCase()}_CHAINLINK_KEY_HASH`];
  let chainlinkFee: Number | undefined =
    Number(process.env[`${network.name.toUpperCase()}_CHAINLINK_FEE`]) *
    10 ** 18; // convert to integer according to LINK decimals

  let multicallAddress;

  // Mock contracts for local testing
  if (network.name === "hardhat" || network.name === "localhost") {
    vrfCoordinatorAddress = await mockVrfCoordinator(linkAddress);
    chainlinkFee = 0;

    multicallAddress = await mockMulticall();
  }

  const Utils: ContractFactory = await ethers.getContractFactory("Utils");
  const utils: Contract = await Utils.deploy();
  await utils.deployed();

  const TokenPack: ContractFactory = await ethers.getContractFactory(
    "TokenPack",
    {
      libraries: {
        Utils: utils.address,
      },
    }
  );
  const tokenPack: Contract = await TokenPack.deploy(
    "NFT Packed",
    "NFTP",
    vrfCoordinatorAddress,
    linkAddress,
    keyHash,
    chainlinkFee
  );
  await tokenPack.deployed();

  if (network.name === "hardhat" || network.name === "localhost") {
    await loadTestBlueprints(utils, tokenPack);
  }

  const tokenAddress = await tokenPack.getTokenContractAddress();
  console.log("Utils contract address:", utils.address);
  console.log("Multicall contract address:", multicallAddress);
  console.log("TokenPack contract Address:", tokenPack.address);
  console.log("Token contract address:", tokenAddress);

  console.log("Saving frontend files...");
  saveFrontEndFiles([
    { name: "TokenPack", address: tokenPack.address },
    { name: "Token", address: tokenAddress },
  ]);
  console.log("Front end files saved");
}

async function mockVrfCoordinator(linkAddress: string | undefined) {
  const vrfCoordinatorFactory: ContractFactory =
    await ethers.getContractFactory("VRFCoordinatorMock");
  const vrfCoordinator = await vrfCoordinatorFactory.deploy(linkAddress);
  await vrfCoordinator.deployed();

  return vrfCoordinator.address;
}

async function mockMulticall() {
  const multicallFactory: ContractFactory = await ethers.getContractFactory(
    "contracts/test/Multicall.sol:Multicall"
  );
  const multicall = await multicallFactory.deploy();
  await multicall.deployed();

  return multicall.address;
}

async function loadTestBlueprints(utils: Contract, tokenPack: Contract) {
  const tokenFactory: ContractFactory = await ethers.getContractFactory(
    "Token",
    {
      libraries: {
        Utils: utils.address,
      },
    }
  );
  const token = tokenFactory.attach(await tokenPack.getTokenContractAddress());
  const blueprints: object[] = [];
  const signers = await ethers.getSigners();

  for (let i = 0; i < 20; i++) {
    await token.createBlueprint(
      "TITLE_" + i,
      "DESCRIPTION_" + i,
      "IPFS_PATH_" + i
    );
    blueprints.push({ author: signers[0].address, blueprint: i });
    console.log("Created test blueprint", i, signers[0].address);
  }
}

function saveFrontEndFiles(contractsId: { name: string; address: string }[]) {
  const fs = require("fs");
  const javascriptDir = __dirname + "/../frontend/src/utils";

  if (!fs.existsSync(javascriptDir)) {
    fs.mkdirSync(javascriptDir);
  }

  let contracts: any = {};
  for (let i = 0; i < contractsId.length; i++) {
    const artifact = artifacts.readArtifactSync(contractsId[i].name);

    contracts[contractsId[i].name] = {
        address: contractsId[i].address,
        abi: artifact.abi,
      };
  }

  fs.writeFileSync(
    javascriptDir + "/contracts-utils.js",
    "export const contracts = " +
      JSON.stringify(contracts, null, 2) +
      ";"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
