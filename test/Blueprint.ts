import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractFactory } from "ethers";

describe("Blueprint contract", () => {
  const IPFS_PATH: string = "someFakeIPFSpath";

  let blueprint: Contract;
  let signers: SignerWithAddress[];
  let authorSigner1: SignerWithAddress;
  let authorSigner2: SignerWithAddress;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    authorSigner1 = signers[1];
    authorSigner2 = signers[2];

    const utilsFactory: ContractFactory = await ethers.getContractFactory(
      "Utils",
      signers[0]
    );
    const utils = await utilsFactory.deploy();
    await utils.deployed();

    const blueprintFactory: ContractFactory = await ethers.getContractFactory(
      "Blueprint",
      {
        signer: signers[0],
        libraries: {
          Utils: utils.address,
        },
      }
    );

    blueprint = await blueprintFactory.deploy();
    await blueprint.deployed();
  });

  it("Creates blueprints successfully", async () => {
    const tx1: TransactionResponse = await blueprint
      .connect(authorSigner1)
      .createBlueprint(IPFS_PATH);
    await expect(tx1)
      .to.emit(blueprint, "BlueprintCreated")
      .withArgs(authorSigner1.address, 0, 0);

    const tx2: TransactionResponse = await blueprint
      .connect(authorSigner1)
      .createBlueprint(IPFS_PATH);
    await expect(tx2)
      .to.emit(blueprint, "BlueprintCreated")
      .withArgs(authorSigner1.address, 1, 1);

    const tx3: TransactionResponse = await blueprint
      .connect(authorSigner2)
      .createBlueprint(IPFS_PATH);
    await expect(tx3)
      .to.emit(blueprint, "BlueprintCreated")
      .withArgs(authorSigner2.address, 2, 0);
  });

  it("Fails blueprint creation with empty ipfs path", async () => {
    // this only works with automining. In case of mining delays, we have to wait
    await expect(blueprint.createBlueprint("")).to.be.revertedWith(
      "ERROR_EMPTY_IPFS_PATH"
    );
  });
});
