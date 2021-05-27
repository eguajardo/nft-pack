import { Link } from "react-router-dom";
import NftCard from "../components/UI/NftCard";
import { contracts } from "../utils/contracts-utils";
import { ethers, utils } from "ethers";
import { useEthers, useContractCall } from "@usedapp/core";
import { useState } from "react";

function NFTIndex() {
  const { library } = useEthers();
  const [content, setContent] = useState([]);

  let [totalBlueprints] =
    useContractCall({
      abi: new utils.Interface(contracts.Blueprint.abi),
      address: contracts.Blueprint.address,
      method: "totalBlueprints",
      args: [],
    }) ?? [];

  if (totalBlueprints) {
    console.log("totalBlueprints:", totalBlueprints.toNumber());

    const blueprint = new ethers.Contract(
      contracts.Blueprint.address,
      contracts.Blueprint.abi,
      library
    );
    totalBlueprints = 1;
    const loadContent = async () => {
      let cards = [];
      for (let i = 0; i < totalBlueprints; i++) {
        const blueprintURI = await blueprint.blueprintURI(i);

        cards.push(<NftCard key={i} uri={blueprintURI} />);
      }

      setContent(cards);
    };

    if (content.length !== totalBlueprints) {
      loadContent();
    }
  }

  return (
    <div>
      <div id="actions" className="container mb-3 d-flex flex-row-reverse">
        <Link className="btn btn-outline-info" to="/nfts/new">
          Create NFT
        </Link>
      </div>
      <div className="container content-container">{content}</div>
    </div>
  );
}

export default NFTIndex;
