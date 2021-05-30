import { loadJsonFromIPFS, ipfsPathToURL } from "../../utils/ipfs-utils";
import { Contract } from "@ethersproject/contracts";
import { contracts } from "../../utils/contracts-utils";
import { utils } from "ethers";
import { useState, useCallback, useEffect } from "react";
import { useContractFunction, useEthers, useBlockNumber } from "@usedapp/core";

function CollectionCard(props) {
  const [metadata, setMetadata] = useState({});
  const [requestId, setRequestId] = useState();
  const [packOpened, setPackOpened] = useState(false);
  const [tokenPackContract] = useState(
    new Contract(
      contracts.TokenPack.address,
      new utils.Interface(contracts.TokenPack.abi)
    )
  );
  const { library, account } = useEthers();
  const block = useBlockNumber();

  const [buttonState, setButtonState] = useState({
    class: "btn btn-primary btn-lg btn-block mt-2",
    disabled: false,
    text: "Buy",
  });

  const { state: ethTxState, send: sendBuyPack } = useContractFunction(
    tokenPackContract,
    "buyPack"
  );

  const loadMetadata = useCallback(async () => {
    const json = await loadJsonFromIPFS(props.uri);

    setMetadata(json);
  }, [props.uri]);

  const loadRequestId = useCallback(async () => {
    const filter = tokenPackContract.filters.PurchaseOrdered(
      account,
      props.collectionId,
      null
    );
    let requestId;
    const logs = await library.getLogs(filter);
    logs.forEach((log) => {
      requestId = tokenPackContract.interface.parseLog(log).args[2];
      console.log("requestId:", requestId);
      setRequestId(requestId);
      setPackOpened(false);
    });
  }, [account, props.collectionId, library, tokenPackContract]);

  const openPack = useCallback(async () => {
    if (!packOpened) {
      const filter = tokenPackContract.filters.PackOpened(requestId, account);
      const logs = await library.getLogs(filter);

      console.log("block", block);
      console.log("openPack logs:", logs);

      if (logs.length > 0) {
        setButtonState({
          class: "btn btn-primary btn-lg btn-block mt-2",
          disabled: false,
          text: "Buy",
        });
        setPackOpened(true);
        props.showPackContent(requestId);
      }
    }
  }, [
    block,
    requestId,
    account,
    library,
    tokenPackContract,
    packOpened,
    props,
  ]);

  useEffect(() => {
    if (ethTxState.status === "Success") {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block mt-2",
        disabled: true,
        text: "Opening pack...",
      });

      loadRequestId();
    } else if (
      ethTxState.status === "Exception" ||
      ethTxState.status === "Fail"
    ) {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block mt-2",
        disabled: false,
        text: "Buy",
      });
    } else if (ethTxState.status === "Mining") {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block mt-2",
        disabled: true,
        text: "Processing...",
      });
    }
  }, [ethTxState, loadRequestId]);

  useEffect(() => {
    openPack();
  }, [openPack]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const buyPack = () => {
    sendBuyPack(props.collectionId);
  };

  return (
    <div className="card">
      {metadata.image && (
        <img
          className="card-img-top"
          alt={metadata.name}
          src={ipfsPathToURL(metadata.image)}
        />
      )}
      <div className="card-body">
        {metadata.name && (
          <div>
            <div className="mt-2 font-weight-bold">{"Name:"}</div>
            <div>{metadata.name}</div>
          </div>
        )}

        {metadata.description && (
          <div>
            <div className="font-weight-bold">{"Description:"}</div>
            <div>{metadata.description}</div>
          </div>
        )}

        <div>
          <div className="font-weight-bold">{"Content:"}</div>
          <div>{props.capacity} random NFTs</div>
        </div>

        <div>
          <div className="font-weight-bold">{"Price:"}</div>
          <div>{props.price} MATIC</div>
        </div>

        <div id="actions" className="mt-4">
          {(ethTxState.status === "Exception" ||
            ethTxState.status === "Fail") && (
            <div className="alert alert-danger">
              <strong>Error executing transaction</strong>
              <p>{ethTxState.errorMessage}</p>
            </div>
          )}
          <button
            onClick={buyPack}
            name="submit"
            className={buttonState.class}
            disabled={buttonState.disabled}
          >
            {buttonState.text}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CollectionCard;
