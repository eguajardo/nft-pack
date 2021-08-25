import { utils } from "ethers";
import { uploadFileToIPFS, uploadJsonToIPFS } from "../../helpers/ipfs";

import { useEffect, useRef, useState } from "react";
import { useContractFunction, useEthers } from "@usedapp/core";
import { useContract } from "../../hooks/useContract";

function CollectionForm(props) {
  const nameInputRef = useRef();
  const descriptionInputRef = useRef();
  const priceInputRef = useRef();
  const capacityInputRef = useRef();
  const fileInputRef = useRef();
  const [walletError, setWalletError] = useState(false);
  const { activateBrowserWallet, account } = useEthers();
  const tokenPackContract = useContract("TokenPack");

  const [buttonState, setButtonState] = useState({
    class: "btn btn-primary btn-lg btn-block",
    disabled: false,
    text: "Submit collection",
  });

  const [enteredTitleIsValid, setEnteredNameIsValid] = useState(true);
  const [enteredDescriptionIsValid, setEnteredDescriptionIsValid] =
    useState(true);
  const [enteredPriceIsValid, setEnteredPriceIsValid] = useState(true);
  const [enteredCapacityIsValid, setEnteredCapacityIsValid] = useState(true);
  const [enteredFileIsValid, setEnteredFileIsValid] = useState(true);

  const { state: ethTxState, send: sendCreateCollection } = useContractFunction(
    tokenPackContract,
    "createTokenCollection"
  );

  console.log(ethTxState);

  useEffect(() => {
    if (ethTxState.status === "Success") {
      setButtonState({
        class: "btn btn-success btn-lg btn-block",
        disabled: true,
        text: "Success!",
      });

      nameInputRef.current.value = "";
      descriptionInputRef.current.value = "";
      priceInputRef.current.value = 0.0;
      capacityInputRef.current.value = 0;
      fileInputRef.current.value = "";
    } else if (
      ethTxState.status === "Exception" ||
      ethTxState.status === "Fail"
    ) {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block",
        disabled: false,
        text: "Submit collection",
      });
    } else if (ethTxState.status === "Mining") {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block",
        disabled: true,
        text: "Processing...",
      });
    }
  }, [ethTxState]);

  const formSubmissionHandler = async (event) => {
    event.preventDefault();

    const enteredName = nameInputRef.current.value;
    const enteredDescription = descriptionInputRef.current.value;
    const enteredPrice = priceInputRef.current.value;
    const enteredCapacity = capacityInputRef.current.value;
    const enteredFile = fileInputRef.current.files[0];

    let error = false;

    if (enteredName.trim() === "") {
      setEnteredNameIsValid(false);
      error = true;
    } else {
      setEnteredNameIsValid(true);
    }
    if (enteredDescription.trim() === "") {
      setEnteredDescriptionIsValid(false);
      error = true;
    } else {
      setEnteredDescriptionIsValid(true);
    }
    if (enteredPrice <= 0.0) {
      setEnteredPriceIsValid(false);
      error = true;
    } else {
      setEnteredPriceIsValid(true);
    }
    if (enteredCapacity <= 0) {
      setEnteredCapacityIsValid(false);
      error = true;
    } else {
      setEnteredCapacityIsValid(true);
    }
    if (enteredFile === undefined) {
      setEnteredFileIsValid(false);
      error = true;
    } else {
      setEnteredFileIsValid(true);
    }

    if (error) {
      return;
    }

    if (!account) {
      try {
        setButtonState({
          class: "btn btn-primary btn-lg btn-block",
          disabled: true,
          text: "Connecting...",
        });
        await activateBrowserWallet(null, true);
      } catch (error) {
        console.log(error);
        setWalletError(true);
        setButtonState({
          class: "btn btn-primary btn-lg btn-block",
          disabled: false,
          text: "Submit collection",
        });
        return;
      }
    }

    if (walletError) {
      setWalletError(false);
    }

    setButtonState({
      class: "btn btn-primary btn-lg btn-block",
      disabled: true,
      text: "Processing...",
    });

    const imageIpfsPath = await uploadFileToIPFS(enteredFile);

    const metadata = {
      name: enteredName,
      description: enteredDescription,
      image: "ipfs://" + imageIpfsPath,
    };

    console.log("selected blueprints:", props.selectedBlueprints);

    const metadataIpfsPath = await uploadJsonToIPFS(metadata);
    sendCreateCollection(
      metadataIpfsPath,
      utils.parseEther(enteredPrice),
      enteredCapacity,
      props.selectedBlueprints
    );
  };

  return (
    <div>
      <button className="close" onClick={props.closeCollectionForm}>
        <span aria-hidden="true">&times;</span>
      </button>
      <br />
      <form onSubmit={formSubmissionHandler}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            ref={nameInputRef}
            type="text"
            name="name"
            id="name"
            placeholder="Your collection's name"
            className={
              enteredTitleIsValid ? "form-control" : "form-control is-invalid"
            }
          />
          <div className="invalid-feedback">itle must not be empty</div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            ref={descriptionInputRef}
            type="text"
            name="description"
            id="description"
            placeholder="Some description"
            className={
              enteredDescriptionIsValid
                ? "form-control"
                : "form-control is-invalid"
            }
          />
          <div className="invalid-feedback">Description must not be empty</div>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price per pack</label>
          <input
            ref={priceInputRef}
            type="number"
            name="price"
            step="0.01"
            id="price"
            className={
              enteredPriceIsValid ? "form-control" : "form-control is-invalid"
            }
          />
          <div className="invalid-feedback">Price must be grater than 0</div>
        </div>

        <div className="form-group">
          <label htmlFor="capacity">Cards per booster pack</label>
          <input
            ref={capacityInputRef}
            type="number"
            name="capacity"
            step="1"
            id="capacity"
            className={
              enteredCapacityIsValid
                ? "form-control"
                : "form-control is-invalid"
            }
          />
          <div className="invalid-feedback">
            Cards per booster must be grater than 0
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input
            ref={fileInputRef}
            type="file"
            name="image-file"
            id="image-file"
            className={
              enteredFileIsValid
                ? "form-control-file"
                : "form-control-file is-invalid"
            }
            accept="image/*"
          />
          <div className="invalid-feedback">Image is missing!</div>
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
            name="submit"
            className={buttonState.class}
            disabled={buttonState.disabled}
          >
            {buttonState.text}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CollectionForm;
