import { Link } from "react-router-dom";
import NftCard from "../components/UI/NftCard";
import { Contract } from "@ethersproject/contracts";
import { contracts } from "../utils/contracts-utils";
import { utils } from "ethers";
import { useContractCall } from "@usedapp/core";

function NFTIndex() {
  const tokenContract = new Contract(
    contracts.Token.address,
    new utils.Interface(contracts.Token.abi)
  );

  const [test] =
    useContractCall({
      abi: new utils.Interface(contracts.Token.abi),
      address: contracts.Token.address,
      method: "totalSupply",
      args: [],
    }) ?? [];

  const testFunction = async () => {
    console.log("test:", test);
  };

  return (
    <div>
      <div id="actions" className="container mb-3 d-flex flex-row-reverse">
        <Link className="btn btn-outline-info" to="/nfts/new">
          Create NFT
        </Link>
      </div>
      <div className="container content-container">
        <NftCard></NftCard>
      </div>

      <div id="actions" className="mt-4">
        <button onClick={testFunction} name="submit">
          test
        </button>
      </div>
    </div>
  );
}

export default NFTIndex;
