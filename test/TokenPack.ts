import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractFactory } from "ethers";

describe("TokenPack contract", () => {
    const NAME: string = "Collection Name";
    const DESCRIPTION: string = "Collection Description";
    const PRICE: Number = 1;
    const CAPACITY: Number = 5;

    let tokenPack: Contract;
    let signers: SignerWithAddress[];
    let packerSigner: SignerWithAddress;
    let authorSigner: SignerWithAddress;
    let blueprintGenerator: Function;

    beforeEach(async () => {
        signers = await ethers.getSigners();
        packerSigner = signers[0];
        authorSigner = signers[1];

        const utilsFactory: ContractFactory = await ethers.getContractFactory(
            "Utils",
            signers[0]
        )
        const utils = await utilsFactory.deploy();
        await utils.deployed();

        const tokenPackFactory: ContractFactory = await ethers.getContractFactory(
            "TokenPack",
            {
                signer: packerSigner,
                libraries: {
                    Utils: utils.address
                }
            }
        );

        tokenPack = await tokenPackFactory.deploy("TOKEN", "TKN");
        await tokenPack.deployed();

        const tokenFactory: ContractFactory = await ethers.getContractFactory(
            "Token",
            {
                signer: authorSigner,
                libraries: {
                    Utils: utils.address
                }
            }
        );
        const token = tokenFactory.attach(await tokenPack.getTokenContractAddress());

        blueprintGenerator = async (quantity: Number) => {
            const blueprints: object[] = [];

            for (let i = 0; i < quantity; i++) {
                await token.createBlueprint("TITLE_" + i, "DESCRIPTION_" + i, "IPFS_PATH_" + i);
                blueprints.push({ author: authorSigner.address, blueprint: i });
            }

            return blueprints;
        }
        
    });

    it('Creates collection successfully', async () => {
        const tx: TransactionResponse = await tokenPack.createTokenCollection(
            NAME, DESCRIPTION, PRICE, CAPACITY, await blueprintGenerator(20)
        );

        await expect(tx)
            .to.emit(tokenPack, "CollectionCreated")
            .withArgs(packerSigner.address, 0);
    });

    it('Fails collection creation with empty name', async () => {
        await expect(tokenPack.createTokenCollection("", DESCRIPTION, PRICE, CAPACITY, await blueprintGenerator(20)))
            .to.be.revertedWith("ERROR_EMPTY_COLLECTION_NAME");
    });

    it('Fails collection creation with under limit price', async () => {
        await expect(tokenPack.createTokenCollection(NAME, DESCRIPTION, 0, CAPACITY, await blueprintGenerator(20)))
            .to.be.revertedWith("ERROR_PRICE_UNDER_LIMIT");
    });

    it('Fails collection creation with under limit capacity', async () => {
        await expect(tokenPack.createTokenCollection(NAME, DESCRIPTION, PRICE, 0, await blueprintGenerator(20)))
            .to.be.revertedWith("ERROR_CAPACITY_UNDER_LIMIT");
    });

    it('Fails collection creation with under limit collection', async () => {
        await expect(tokenPack.createTokenCollection(NAME, DESCRIPTION, PRICE, CAPACITY, await blueprintGenerator(19)))
            .to.be.revertedWith("ERROR_BLUEPRINTS_UNDER_LIMIT");
    });
});