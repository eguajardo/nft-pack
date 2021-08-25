import { utils } from "ethers";

import { useContractCall } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";
import { useContract } from "../hooks/useContract";

import NftCard from "../components/UI/NftCard";
import CollectionCard from "../components/UI/CollectionCard";

function CollectionIndex() {
  const [content, setContent] = useState([]);
  const [packContent, setPackContent] = useState([]);
  const tokenPackContract = useContract("TokenPack");
  const tokenContract = useContract("Token");

  console.log("tokenContract", tokenContract);

  const [totalCollectionsBigNumber] =
    useContractCall({
      abi: tokenPackContract?.interface,
      address: tokenPackContract?.address,
      method: "totalCollections",
      args: [],
    }) ?? [];

  const totalCollections = totalCollectionsBigNumber
    ? totalCollectionsBigNumber.toNumber()
    : undefined;

  const showPackContent = useCallback(
    async (requestId) => {
      const mintedTokens = await tokenPackContract.purchaseOrderTokens(
        requestId
      );

      console.log("pack content:", mintedTokens);

      let cardsDeck = [];
      for (let i = 0; i < mintedTokens.length; i++) {
        const tokenURI = await tokenContract.tokenURI(mintedTokens[i]);

        cardsDeck.push(<NftCard key={i} uri={tokenURI} />);
      }

      setPackContent(cardsDeck);
      window.$("#packContent").modal("show");
    },
    [tokenContract, tokenPackContract]
  );

  const loadContent = useCallback(async () => {
    if (totalCollections) {
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
  }, [totalCollections, showPackContent, tokenPackContract]);

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
