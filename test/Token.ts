import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";

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
        const tokenFactory: ContractFactory = await ethers.getContractFactory(
            "Token",
            signers[0]
        );

        authorSigner = signers[0];
        minterSigner = signers[1];

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
        const blueprintTx: TransactionResponse = await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);
        await blueprintTx.wait();

        const tx: TransactionResponse = await token.connect(minterSigner).mintFromBlueprint(
            signers[2].address,     // receptor
            authorSigner.address,   // author
            0                       // blueprint index
        );

        await expect(tx)
            .to.emit(token, "Minted")
            .withArgs(0, signers[2].address, authorSigner.address, 0);
    });

    it('Fails minting without minter role', async() => {
        const blueprintTx: TransactionResponse = await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);
        await blueprintTx.wait();

        const tx: Promise<TransactionResponse> = token.mintFromBlueprint(
            signers[2].address,     // receptor
            authorSigner.address,   // author
            0                       // blueprint index
        );

        await expect(tx)
            .to.be.revertedWith("ERROR_UNAUTHORIZED_MINTER");
    });

    it("Fails when author doesn't exists", async() => {
        const blueprintTx: TransactionResponse = await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);
        await blueprintTx.wait();

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

});