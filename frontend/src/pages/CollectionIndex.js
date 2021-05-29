import CollectionCard from "../components/UI/NftCard";
import { contracts } from "../utils/contracts-utils";
import { ethers, utils } from "ethers";
import { useEthers, useContractCall } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";

function CollectionIndex() {
  const { library } = useEthers();
  const [content, setContent] = useState([]);

  let [totalCollections] =
    useContractCall({
      abi: new utils.Interface(contracts.TokenPack.abi),
      address: contracts.TokenPack.address,
      method: "totalCollections",
      args: [],
    }) ?? [];

  const loadContent = useCallback(async () => {
    if (totalCollections) {
      const tokenPackContract = new ethers.Contract(
        contracts.TokenPack.address,
        contracts.TokenPack.abi,
        library
      );

      let cardsDeck = [];
      for (let i = totalCollections - 1; i >= 0; i--) {
        const collectionURI = await tokenPackContract.collectionURI(i);

        cardsDeck.push(<CollectionCard key={i} uri={collectionURI} />);
      }

      setContent(cardsDeck);
    }
  }, [totalCollections, library]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <div className="container content-container">
      <div className="card-deck d-flex justify-content-center">{content}</div>
    </div>
  );
}

export default CollectionIndex;
