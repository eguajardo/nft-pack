import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";

describe("Token contract", () => {
    let token: Contract;
    let signers: SignerWithAddress[]

    beforeEach(async () => {
        signers = await ethers.getSigners();
        const tokenFactory: ContractFactory = await ethers.getContractFactory(
            "Token",
            signers[0]
        );
        token = await tokenFactory.deploy("TOKEN", "TKN", signers[0].address);
        await token.deployed();
    });

    it('Creates blueprint successfully', async() => {
        const TITLE: string = "NFT Title";
        const DESCRIPTION: string = "NFT Description";
        const IPFS_PATH: string = "someFakeIPFSpath";

        const tx = await token.createBlueprint(TITLE, DESCRIPTION, IPFS_PATH);

        await expect(tx)
            .to.emit(token, "BlueprintCreated")
            .withArgs(signers[0].address, 0);
    });

});