import CollectionCard from "../components/UI/CollectionCard";
import { contracts } from "../utils/contracts-utils";
import { Contract } from "@ethersproject/contracts";
import { ethers, utils } from "ethers";
import { useEthers, useContractCall } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";

function CollectionIndex() {
  const { library } = useEthers();
  const [content, setContent] = useState([]);
  const [packContent, setPackContent] = useState();

  let [totalCollections] =
    useContractCall({
      abi: new utils.Interface(contracts.TokenPack.abi),
      address: contracts.TokenPack.address,
      method: "totalCollections",
      args: [],
    }) ?? [];

  const showPackContent = useCallback(
    async (requestId) => {
      const tokenContract = new Contract(
        contracts.Token.address,
        new utils.Interface(contracts.Token.abi)
      );

      const filter = tokenContract.filters.Minted(null, null, requestId);
      const logs = await library.getLogs(filter);

      console.log("pack content:", logs);

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

        console.log("tokenCollection:", tokenCollection);

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
      <button
        type="button"
        className="btn btn-primary"
        onClick={showPackContent}
      >
        Launch demo modal
      </button>

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
            <div className="modal-body">{packContent}</div>
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
