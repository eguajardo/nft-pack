import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";

describe("TokenPack contract", () => {
  const LINK_ADDRESS: string = "0x326c977e6efc84e512bb9c30f76e30c160ed06fb";
  const KEY_HASH: string =
    "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4";
  const ORACLE_FEE: Number = 0;

  const IPFS_PATH: string = "someFakeIPFSpath";
  const PRICE: Number = 1;
  const CAPACITY: Number = 5;

  let tokenPack: Contract;
  let token: Contract;
  let vrfCoordinator: Contract;
  let signers: SignerWithAddress[];
  let distributorSigner: SignerWithAddress;
  let authorSigner: SignerWithAddress;
  let blueprintGenerator: Function;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    distributorSigner = signers[0];
    authorSigner = signers[1];

    const utilsFactory: ContractFactory = await ethers.getContractFactory(
      "Utils",
      signers[0]
    );
    const utils = await utilsFactory.deploy();
    await utils.deployed();

    const vrfCoordinatorFactory: ContractFactory =
      await ethers.getContractFactory("VRFCoordinatorMock", signers[0]);
    vrfCoordinator = await vrfCoordinatorFactory.deploy(LINK_ADDRESS);
    await vrfCoordinator.deployed();

    const tokenPackFactory: ContractFactory = await ethers.getContractFactory(
      "TokenPack",
      {
        signer: distributorSigner,
        libraries: {
          Utils: utils.address,
        },
      }
    );

    tokenPack = await tokenPackFactory.deploy(
      "TOKEN",
      "TKN",
      vrfCoordinator.address,
      LINK_ADDRESS,
      KEY_HASH,
      ORACLE_FEE
    );
    await tokenPack.deployed();

    const tokenFactory: ContractFactory = await ethers.getContractFactory(
      "Token",
      {
        signer: authorSigner,
        libraries: {
          Utils: utils.address,
        },
      }
    );
    token = tokenFactory.attach(await tokenPack.tokenContractAddress());

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
      const blueprints: object[] = [];

      for (let i = 0; i < quantity; i++) {
        await token.createBlueprint(
          "TITLE_" + i,
          "DESCRIPTION_" + i,
          "IPFS_PATH_" + i
        );
        blueprints.push({ author: authorSigner.address, blueprint: i });
      }

      return blueprints;
    };

    blueprintGenerator = async (quantity: Number) => {
      const blueprints: Number[] = [];

      for (let i = 0; i < quantity; i++) {
        await blueprint.createBlueprint("IPFS_PATH_" + i);
        blueprints.push(i);
      }

      return blueprints;
    };
  });

  it("Creates collection successfully", async () => {
    const tx: TransactionResponse = await tokenPack.createTokenCollection(
      IPFS_PATH,
      PRICE,
      CAPACITY,
      await blueprintGenerator(10)
    );

    await expect(tx)
      .to.emit(tokenPack, "CollectionCreated")
      .withArgs(distributorSigner.address, 0, 0);
  });

  it("Fails collection creation with empty ipfsPath", async () => {
    await expect(
      tokenPack.createTokenCollection(
        "",
        PRICE,
        CAPACITY,
        await blueprintGenerator(10)
      )
    ).to.be.revertedWith("ERROR_EMPTY_IPFS_PATH");
  });

  it("Fails collection creation with under limit price", async () => {
    await expect(
      tokenPack.createTokenCollection(
        IPFS_PATH,
        0,
        CAPACITY,
        await blueprintGenerator(10)
      )
    ).to.be.revertedWith("ERROR_PRICE_UNDER_LIMIT");
  });

  it("Fails collection creation with under limit capacity", async () => {
    await expect(
      tokenPack.createTokenCollection(
        IPFS_PATH,
        PRICE,
        0,
        await blueprintGenerator(10)
      )
    ).to.be.revertedWith("ERROR_CAPACITY_UNDER_LIMIT");
  });

  it("Fails collection creation with under limit collection", async () => {
    await expect(
      tokenPack.createTokenCollection(
        IPFS_PATH,
        PRICE,
        CAPACITY,
        await blueprintGenerator(4)
      )
    ).to.be.revertedWith("ERROR_BLUEPRINTS_UNDER_LIMIT");
  });

  it("Buys pack successfully", async () => {
    await tokenPack.createTokenCollection(
      IPFS_PATH,
      PRICE,
      CAPACITY,
      await blueprintGenerator(10)
    );

    // second collection
    await tokenPack.createTokenCollection(
      IPFS_PATH,
      PRICE,
      CAPACITY,
      await blueprintGenerator(10)
    );

    // Non state changing call just to preview the requestId
    const requestId = await tokenPack.callStatic.buyPack(1, {value: 1});
    const tx: TransactionResponse = await tokenPack.buyPack(1,{value: 1});

    await expect(tx)
      .to.emit(tokenPack, "PurchaseOrdered")
      .withArgs(distributorSigner.address, 1, requestId);

    const vrfTx: TransactionResponse =
      await vrfCoordinator.callBackWithRandomness(
        requestId,
        777,
        tokenPack.address,
        { gasLimit: 230000 }
      );

    await expect(vrfTx)
      .to.emit(tokenPack, "PurchaseOrderSigned")
      .withArgs(requestId);

    // Second pucase
    const requestId2 = await tokenPack.callStatic.buyPack(1, {value: 1});
    const tx2: TransactionResponse = await tokenPack.buyPack(1, {value: 1});

    await expect(tx2)
      .to.emit(tokenPack, "PurchaseOrdered")
      .withArgs(distributorSigner.address, 1, requestId2);

    const vrftx2: TransactionResponse =
      await vrfCoordinator.callBackWithRandomness(
        requestId2,
        777,
        tokenPack.address,
        { gasLimit: 230000 }
      );

    await expect(vrftx2)
      .to.emit(tokenPack, "PurchaseOrderSigned")
      .withArgs(requestId2);

    const uri: string = await token.tokenURI(0);
    expect(uri).to.equals("ipfs://IPFS_PATH_3");
  });

  it("Fails purchase without amount", async () => {
    await tokenPack.createTokenCollection(
      IPFS_PATH,
      PRICE,
      CAPACITY,
      await blueprintGenerator(10)
    );

    await expect(tokenPack.buyPack(0)).to.be.revertedWith(
      "ERROR_INVALID_AMOUNT"
    );

  });

  it("Fails purchase with invalid amount", async () => {
    await tokenPack.createTokenCollection(
      IPFS_PATH,
      PRICE,
      CAPACITY,
      await blueprintGenerator(10)
    );

    await expect(tokenPack.buyPack(0, {value: 2})).to.be.revertedWith(
      "ERROR_INVALID_AMOUNT"
    );

  });

  it("Fails buying invalid collection", async () => {
    await expect(tokenPack.buyPack(0)).to.be.revertedWith(
      "ERROR_INVALID_COLLECTION"
    );
  });
});
