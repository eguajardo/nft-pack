import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractFactory } from "ethers";
import { FactoryOptions } from "hardhat/types";

describe("Token contract", () => {
    const TITLE: string = "NFT Title";
    const DESCRIPTION: string = "NFT Description";
    const IPFS_PATH: string = "someFakeIPFSpath";

    let token: Contract;
    let signers: SignerWithAddress[]
    let authorSigner: SignerWithAddress;
    let minterSigner: SignerWithAddress;    

    beforeEach(async () => {
        signers = await ethers.getSigners();
        authorSigner = signers[0];
        minterSigner = signers[1];

        const utilsFactory: ContractFactory = await ethers.getContractFactory(
            "Utils",
            signers[0]
        )
        const utils = await utilsFactory.deploy();
        await utils.deployed();

        const tokenFactory: ContractFactory = await ethers.getContractFactory(
            "Token",
            {
                signer: signers[0],
                libraries: {
                    Utils: utils.address
                }
            }
        );

        token = await tokenFactory.deploy("TOKEN", "TKN", minterSigner.address);
        await token.deployed();
    });

    it('Creates blueprint successfully', async() => {
        const tx: TransactionResponse = await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        await expect(tx)
            .to.emit(token, "BlueprintCreated")
            .withArgs(authorSigner.address, 0);
    });

    it('Fails blueprint creation with empty title', async() => {
        // this only works with automining. In case of mining delays, we have to wait
        await expect(token.createBlueprint("", DESCRIPTION, IPFS_PATH))
            .to.be.revertedWith("ERROR_EMPTY_TITLE");
    });

    it('Mints NFT token', async() => {
        await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        const tx: TransactionResponse = await token.connect(minterSigner).mintFromBlueprint(
            signers[2].address,     // receptor
            authorSigner.address,   // author
            0                       // blueprint index
        );

        await expect(tx)
            .to.emit(token, "Minted")
            .withArgs(0, signers[2].address, authorSigner.address, 0);
        
        const balance: BigNumber = await token.balanceOf(signers[2].address);
        expect(balance.toNumber()).to.equals(1);
    });

    it('Fails minting without minter role', async() => {
        await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        const tx: Promise<TransactionResponse> = token.mintFromBlueprint(
            signers[2].address,     // receptor
            authorSigner.address,   // author
            0                       // blueprint index
        );

        await expect(tx)
            .to.be.revertedWith("ERROR_UNAUTHORIZED_MINTER");
    });

    it("Fails when author doesn't exists", async() => {
        await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        const tx: Promise<TransactionResponse> = token.connect(minterSigner).mintFromBlueprint(
            signers[2].address,     // receptor
            signers[2].address,     // author
            0                       // blueprint index
        );

        await expect(tx)
            .to.be.revertedWith("ERROR_INVALID_BLUEPRINT");
    });

    it("Fails when blueprint doesn't exists", async() => {
        const tx: Promise<TransactionResponse> = token.connect(minterSigner).mintFromBlueprint(
            signers[2].address,     // receptor
            authorSigner.address,   // author
            0                       // blueprint index
        );

        await expect(tx)
            .to.be.revertedWith("ERROR_INVALID_BLUEPRINT");
    });

    it('Returns correct tokenURI', async() => {
        await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        const tx: TransactionResponse = await token.connect(minterSigner).mintFromBlueprint(
            signers[2].address,     // receptor
            authorSigner.address,   // author
            0                       // blueprint index
        );

        const uri: string = await token.tokenURI(0);
        expect(uri).to.equals("https://ipfs.infura.io/ipfs/" + IPFS_PATH);
    });

    it("Fails with invalid tokenID", async() => {
        await expect(token.tokenURI(0))
            .to.be.revertedWith("ERROR_INVALID_TOKEN_ID");
    });

});