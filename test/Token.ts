import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractFactory } from "ethers";

describe("Token contract", () => {
  const PURCHASE_ORDER_ID =
    "0xe6dee4b0f846610cfb562207cb4f020aadcb6d0fa7b4e2c0b2db4a15e5a4936a";

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
      .mintFromPack(
        signers[3].address, // receptor
        PURCHASE_ORDER_ID,
        0
      );

    await expect(tx)
      .to.emit(token, "Minted")
      .withArgs(0, signers[3].address, PURCHASE_ORDER_ID);

    const balance: BigNumber = await token.balanceOf(signers[3].address);
    expect(balance.toNumber()).to.equals(1);
  });

  it("Fails minting without minter role", async () => {
    const tx: Promise<TransactionResponse> = token.mintFromPack(
      signers[3].address, // receptor
      PURCHASE_ORDER_ID,
      0
    );

    await expect(tx).to.be.revertedWith("ERROR_UNAUTHORIZED_MINTER");
  });

  it("Fails with invalid tokenID", async () => {
    await expect(token.tokenURI(0)).to.be.revertedWith(
      "ERROR_INVALID_TOKEN_ID"
    );
  });
});
