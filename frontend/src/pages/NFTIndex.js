import { useContractCall } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";
import { useContract } from "../hooks/useContract";

import { Link } from "react-router-dom";
import CollectionForm from "../components/UI/CollectionForm";
import BlueprintCard from "../components/UI/BlueprintCard";

function NFTIndex() {
  const [content, setContent] = useState([]);
  const [selectedBlueprints, setSelectedBlueprints] = useState([]);
  const [collectionCreation, setCollectionCreation] = useState(false);
  const blueprintContract = useContract("Blueprint");

  const [totalBlueprintsBigNumber] =
    useContractCall({
      abi: blueprintContract?.interface,
      address: blueprintContract?.address,
      method: "totalBlueprints",
      args: [],
    }) ?? [];

  const totalBlueprints = totalBlueprintsBigNumber
    ? totalBlueprintsBigNumber.toNumber()
    : undefined;

  const setSelected = (blueprintId, selected) => {
    let newArray = [];
    if (selected) {
      setSelectedBlueprints((arr) => [...arr, blueprintId]);
    } else {
      newArray = selectedBlueprints.filter((value, index, arr) => {
        return value !== blueprintId;
      });

      setSelectedBlueprints((arr) => [...newArray]);
    }
  };

  const loadContent = useCallback(async () => {
    if (totalBlueprints) {
      let cardsDeck = [];
      for (let i = totalBlueprints - 1; i >= 0; i--) {
        const blueprintURI = await blueprintContract.blueprintURI(i);

        cardsDeck.push(
          <BlueprintCard
            key={i}
            blueprintId={i}
            uri={blueprintURI}
            setSelected={setSelected}
          />
        );
      }

      setContent(cardsDeck);
    }
  }, [totalBlueprints, blueprintContract]);

  const openCollectionForm = () => {
    setCollectionCreation(true);
  };

  const closeCollectionForm = () => {
    setCollectionCreation(false);
  };

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <div className="row mx-3">
      <div className={collectionCreation ? "col-8" : "container"}>
        <div id="actions" className="mb-3 d-flex flex-row-reverse">
          <Link className="btn btn-info ml-2" to="/nfts/new">
            Create new NFT blueprint
          </Link>
          <button
            onClick={openCollectionForm}
            className={
              selectedBlueprints.length === 0
                ? "btn btn-secondary"
                : "btn btn-info"
            }
            disabled={selectedBlueprints.length === 0 || collectionCreation}
          >
            Create collection from selection
          </button>
        </div>
        <div className="content-container">
          <div className="card-deck d-flex justify-content-center">
            {content}
          </div>
        </div>
      </div>
      {collectionCreation && (
        <div className="col-4">
          <div className="mb-5"></div>
          <div className="content-container">
            <CollectionForm
              selectedBlueprints={selectedBlueprints}
              closeCollectionForm={closeCollectionForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default NFTIndex;
