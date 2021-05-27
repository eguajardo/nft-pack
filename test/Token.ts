import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractFactory } from "ethers";

describe("Token contract", () => {
  let token: Contract;
  let signers: SignerWithAddress[];
  let authorSigner: SignerWithAddress;
  let minterSigner: SignerWithAddress;
  let blueprintGenerator: Function;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    minterSigner = signers[1];
    authorSigner = signers[2];

    const utilsFactory: ContractFactory = await ethers.getContractFactory(
      "Utils",
      signers[0]
    );
    const utils = await utilsFactory.deploy();
    await utils.deployed();

    const tokenFactory: ContractFactory = await ethers.getContractFactory(
      "Token",
      {
        signer: signers[0],
        libraries: {
          Utils: utils.address,
        },
      }
    );

    token = await tokenFactory.deploy("TOKEN", "TKN", minterSigner.address);
    await token.deployed();

    const blueprintFactory: ContractFactory = await ethers.getContractFactory(
      "Blueprint",
      {
        signer: authorSigner,
        libraries: {
          Utils: utils.address,
        },
      }
    );
    const blueprint = blueprintFactory.attach(
      await token.blueprintContractAddress()
    );

    blueprintGenerator = async (quantity: Number) => {
      const blueprints: Number[] = [];

      for (let i = 0; i < quantity; i++) {
        await blueprint.createBlueprint("IPFS_PATH_" + i);
        blueprints.push(i);
      }

      return blueprints;
    };
  });

  it("Mints NFT token", async () => {
    const tx: TransactionResponse = await token
      .connect(minterSigner)
      .mintFromBlueprint(
        signers[3].address, // receptor
        (
          await blueprintGenerator(2)
        )[1] // blueprint id
      );

    await expect(tx)
      .to.emit(token, "Minted")
      .withArgs(0, signers[3].address, 1);

    const balance: BigNumber = await token.balanceOf(signers[3].address);
    expect(balance.toNumber()).to.equals(1);
  });

  it("Fails minting without minter role", async () => {
    const tx: Promise<TransactionResponse> = token.mintFromBlueprint(
      signers[3].address, // receptor
      (await blueprintGenerator(1))[0] // blueprint index
    );

    await expect(tx).to.be.revertedWith("ERROR_UNAUTHORIZED_MINTER");
  });

  it("Fails when blueprint doesn't exists", async () => {
    const tx: Promise<TransactionResponse> = token
      .connect(minterSigner)
      .mintFromBlueprint(
        signers[3].address, // receptor
        0 // blueprint index
      );

    await expect(tx).to.be.revertedWith("ERROR_INVALID_BLUEPRINT_ID");
  });

  it("Returns correct tokenURI", async () => {
    const tx: TransactionResponse = await token
      .connect(minterSigner)
      .mintFromBlueprint(
        signers[3].address, // receptor
        (
          await blueprintGenerator(2)
        )[1] // blueprint index
      );

    const uri: string = await token.tokenURI(0);
    expect(uri).to.equals("ipfs://IPFS_PATH_1");
  });

  it("Fails with invalid tokenID", async () => {
    await expect(token.tokenURI(0)).to.be.revertedWith(
      "ERROR_INVALID_TOKEN_ID"
    );
  });
});
