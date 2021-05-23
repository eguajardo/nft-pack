import { Contract, ContractFactory } from "@ethersproject/contracts";
import { artifacts, ethers, network } from "hardhat";

async function main() {
    console.log("Deploying to network:", network.name);

    const Utils: ContractFactory = await ethers.getContractFactory("Utils");
    const utils: Contract = await Utils.deploy();
    await utils.deployed();

    const TokenPack: ContractFactory = await ethers.getContractFactory(
        "TokenPack",
        {
            libraries: {
                Utils: utils.address
            }
        }
    );
    const tokenPack: Contract = await TokenPack.deploy("NFT Packed", "NFTP");
    await tokenPack.deployed();

    console.log("Contract Address:", tokenPack.address);
    console.log("Contract Hash:", tokenPack.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });