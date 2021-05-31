import { loadJsonFromIPFS, ipfsPathToURL } from "../../utils/ipfs-utils";
import { contracts } from "../../utils/contracts-utils";
import { ethers, utils } from "ethers";
import { useState, useCallback, useEffect } from "react";
import { useContractFunction, useEthers, useBlockNumber } from "@usedapp/core";

function CollectionCard(props) {
  const [metadata, setMetadata] = useState({});
  const [requestId, setRequestId] = useState();
  const [packOpened, setPackOpened] = useState(false);
  const [walletError, setWalletError] = useState(false);
  const { activateBrowserWallet, account, library } = useEthers();
  const block = useBlockNumber();

  const [buttonState, setButtonState] = useState({
    class: "btn btn-primary btn-lg btn-block mt-2",
    disabled: false,
    text: "Buy",
  });

  const tokenPackContract = new ethers.Contract(
    contracts.TokenPack.address,
    contracts.TokenPack.abi,
    library
  );

  const { state: ethTxState, send: sendBuyPack } = useContractFunction(
    tokenPackContract,
    "buyPack"
  );

  const loadMetadata = useCallback(async () => {
    const json = await loadJsonFromIPFS(props.uri);

    setMetadata(json);
  }, [props.uri]);

  const loadRequestId = useCallback(
    async (receipt) => {
      const filter = tokenPackContract.filters.PurchaseOrdered(
        account,
        props.collectionId,
        null
      );

      console.log("filter", filter);
      const logs = receipt.logs.filter((log) => {
        return log.topics[0] === filter.topics[0];
      });
      const vrfRequestId = tokenPackContract.interface.parseLog(logs[0])
        .args[2];
      if (vrfRequestId) {
        console.log("requestId:", vrfRequestId);
        setRequestId(vrfRequestId);
        setPackOpened(false);
      }
    },
    [account, props.collectionId]
  );

  const openPack = useCallback(async () => {
    if (!packOpened && requestId) {
      console.log("purchaseOrder:", requestId);
      const signature = await tokenPackContract.purchaseOrderSignature(
        requestId
      );

      if (signature && signature.toNumber() !== 0) {
        setButtonState({
          class: "btn btn-primary btn-lg btn-block mt-2",
          disabled: false,
          text: "Buy",
        });
        setPackOpened(true);
        props.showPackContent(requestId);
      }
    }
  }, [requestId, packOpened, props]);

  useEffect(() => {
    console.log("ethState:", ethTxState);

    if (ethTxState.status === "Success") {
      loadRequestId(ethTxState.receipt);

      setButtonState({
        class: "btn btn-primary btn-lg btn-block mt-2",
        disabled: true,
        text: "Opening pack...",
      });
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
  }, [openPack, block]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const buyPack = async () => {
    if (!account) {
      try {
        setButtonState({
          class: "btn btn-primary btn-lg btn-block mt-2",
          disabled: true,
          text: "Connecting...",
        });
        await activateBrowserWallet(null, true);
      } catch (error) {
        console.log(error);
        setWalletError(true);
        setButtonState({
          class: "btn btn-primary btn-lg btn-block mt-2",
          disabled: false,
          text: "Buy",
        });
        return;
      }
    }

    if(walletError) {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block mt-2",
        disabled: true,
        text: "Processing...",
      });
      setWalletError(false);
    }
    sendBuyPack(props.collectionId, { value: utils.parseEther(props.price) });
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
          {walletError && (
            <div className="alert alert-danger">
              <strong>Error connecting to wallet</strong>
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
