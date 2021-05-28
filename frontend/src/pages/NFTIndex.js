import { Link } from "react-router-dom";
import NftCard from "../components/UI/NftCard";
import { contracts } from "../utils/contracts-utils";
import { ethers, utils } from "ethers";
import { useEthers, useContractCall } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";

function NFTIndex() {
  const { library } = useEthers();
  const [content, setContent] = useState([]);
  const [selectedBlueprints, setSelectedBlueprints] = useState([]);

  let [totalBlueprints] =
    useContractCall({
      abi: new utils.Interface(contracts.Blueprint.abi),
      address: contracts.Blueprint.address,
      method: "totalBlueprints",
      args: [],
    }) ?? [];

  console.log("render");

  const setSelected = useCallback((blueprintId, selected) => {
    let newArray = [];
    if (selected) {
      setSelectedBlueprints((arr) => [...arr, blueprintId]);
    } else {
      newArray = selectedBlueprints.filter((value, index, arr) => {
        return value !== blueprintId;
      });

      setSelectedBlueprints((arr) => [...newArray]);
    }
  }, [selectedBlueprints]);

  const loadContent = useCallback(async () => {
    if (totalBlueprints) {
      console.log("totalBlueprints:", totalBlueprints.toNumber());

      const blueprint = new ethers.Contract(
        contracts.Blueprint.address,
        contracts.Blueprint.abi,
        library
      );

      let cardsDeck = [];
      for (let i = totalBlueprints - 1; i >= 0; i--) {
        const blueprintURI = await blueprint.blueprintURI(i);

        cardsDeck.push(
          <NftCard
            key={i}
            blueprintId={i}
            uri={blueprintURI}
            setSelected={setSelected}
          />
        );
      }

      setContent(cardsDeck);
    }
  }, [totalBlueprints, library, setSelected]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <div>
      <div id="actions" className="container mb-3 d-flex flex-row-reverse">
        <button
          className={selectedBlueprints.length === 0 ? "btn btn-secondary ml-2" : "btn btn-info ml-2"}
          disabled={selectedBlueprints.length === 0}
        >
          Create collection from selection
        </button>
        <Link className="btn btn-info" to="/nfts/new">
          Create new NFT blueprint
        </Link>
      </div>
      <div className="container content-container">
        <div className="card-deck d-flex justify-content-center">{content}</div>
      </div>
    </div>
  );
}

export default NFTIndex;
