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

    beforeEach(async () => {
        signers = await ethers.getSigners();
        const tokenFactory: ContractFactory = await ethers.getContractFactory(
            "Token",
            signers[0]
        );
        token = await tokenFactory.deploy("TOKEN", "TKN", signers[1].address);
        await token.deployed();
    });

    it('Creates blueprint successfully', async() => {
        const tx: TransactionResponse = await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        await expect(tx)
            .to.emit(token, "BlueprintCreated")
            .withArgs(signers[0].address, 0);
    });

    it('Fails blueprint creation with empty title', async() => {
        const tx: TransactionResponse = await token.createBlueprint("", DESCRIPTION, IPFS_PATH);

        await expect(tx.wait())
            .to.be.reverted;
    });

});