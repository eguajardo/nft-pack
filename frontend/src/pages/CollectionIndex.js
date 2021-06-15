import CollectionCard from "../components/UI/CollectionCard";
import { contracts } from "../utils/contracts-utils";
import { ethers, utils } from "ethers";
import { useEthers, useContractCall } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";
import MetadataCard from "../components/UI/MetadataCard";

function CollectionIndex() {
  const { library } = useEthers();
  const [content, setContent] = useState([]);
  const [packContent, setPackContent] = useState([]);

  const [totalCollectionsBigNumber] =
    useContractCall({
      abi: new utils.Interface(contracts.TokenPack.abi),
      address: contracts.TokenPack.address,
      method: "totalCollections",
      args: [],
    }) ?? [];

  const totalCollections = totalCollectionsBigNumber
    ? totalCollectionsBigNumber.toNumber()
    : undefined;

  const showPackContent = useCallback(
    async (requestId) => {
      const tokenPackContract = new ethers.Contract(
        contracts.TokenPack.address,
        contracts.TokenPack.abi,
        library
      );

      const mintedTokens = await tokenPackContract.purchaseOrderTokens(
        requestId
      );

      console.log("pack content:", mintedTokens);

      const tokenContract = new ethers.Contract(
        contracts.Token.address,
        contracts.Token.abi,
        library
      );
      let cardsDeck = [];
      for (let i = 0; i < mintedTokens.length; i++) {
        const tokenURI = await tokenContract.tokenURI(mintedTokens[i]);

        cardsDeck.push(<MetadataCard key={i} uri={tokenURI} />);
      }

      setPackContent(cardsDeck);
      window.$("#packContent").modal("show");
    },
    [library]
  );

  const loadContent = useCallback(async () => {
    if (totalCollections) {
      const tokenPackContract = new ethers.Contract(
        contracts.TokenPack.address,
        contracts.TokenPack.abi,
        library
      );

      let cardsDeck = [];
      for (let i = totalCollections - 1; i >= 0; i--) {
        const tokenCollection = await tokenPackContract.tokenCollection(i);

        cardsDeck.push(
          <CollectionCard
            key={i}
            collectionId={i}
            uri={tokenCollection.ipfsPath}
            capacity={tokenCollection.capacity}
            price={utils.formatEther(tokenCollection.price)}
            showPackContent={showPackContent}
          />
        );
      }

      setContent(cardsDeck);
    }
  }, [totalCollections, library, showPackContent]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <div className="container content-container">
      <div className="card-deck d-flex justify-content-center">{content}</div>

      <div
        className="modal fade"
        id="packContent"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="packContentLabel"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="packContentLabel">
                You got NFTs!
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="card-deck d-flex justify-content-center">
                {packContent}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionIndex;
