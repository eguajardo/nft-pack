import { useState } from "react";
import { uploadFileToIPFS, uploadJsonToIPFS } from "../utils/ipfs-utils";
import { Contract } from "@ethersproject/contracts";
import { contracts } from "../utils/contracts-utils";
import { utils } from "ethers";
import { useContractFunction, useEthers } from "@usedapp/core";
import useInput from "../hooks/use-input";

function NFTNew() {
  const {
    value: enteredTitle,
    isValid: enteredTitleIsValid,
    hasError: titleInputHasError,
    valueChangeHandler: titleChangedHandler,
    inputBlurHandler: titleBlurHandler,
    reset: resetTitleInput,
  } = useInput((value) => value.trim() !== "");

  const {
    value: enteredDescription,
    isValid: enteredDescriptionIsValid,
    hasError: descriptionInputHasError,
    valueChangeHandler: descriptionChangedHandler,
    inputBlurHandler: descriptionBlurHandler,
    reset: resetDescriptionInput,
  } = useInput((value) => value.trim() !== "");

  const {
    value: enteredFilename,
    files: enteredFiles,
    isValid: enteredFileIsValid,
    hasError: fileInputHasError,
    valueChangeHandler: fileChangedHandler,
    inputBlurHandler: fileBlurHandler,
    reset: resetFileInput,
  } = useInput((value) => value.trim() !== "");

  const [walletError, setWalletError] = useState(false);
  const { activateBrowserWallet, account } = useEthers();

  const [buttonState, setButtonState] = useState({
    class: "btn btn-primary btn-lg btn-block",
    disabled: false,
    text: "Submit NFT blueprint",
    status: "None",
  });

  const blueprintContract = new Contract(
    contracts.Blueprint.address,
    new utils.Interface(contracts.Blueprint.abi)
  );

  const { state: ethTxState, send: sendCreateBlueprint } = useContractFunction(
    blueprintContract,
    "createBlueprint"
  );

  console.log(ethTxState);

  if (buttonState.status !== ethTxState.status) {
    if (ethTxState.status === "Success") {
      setButtonState({
        class: "btn btn-success btn-lg btn-block",
        disabled: true,
        text: "Success!",
        status: ethTxState.status,
      });
    } else if (
      ethTxState.status === "Exception" ||
      ethTxState.status === "Fail"
    ) {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block",
        disabled: false,
        text: "Submit NFT blueprint",
        status: ethTxState.status,
      });
    } else if (ethTxState.status === "Mining") {
      setButtonState({
        class: "btn btn-primary btn-lg btn-block",
        disabled: true,
        text: "Processing...",
        status: ethTxState.status,
      });
    }
  }

  const formSubmissionHandler = async (event) => {
    event.preventDefault();

    if (
      !enteredTitleIsValid ||
      !enteredDescriptionIsValid ||
      !enteredFileIsValid
    ) {
      // Mark them as touched if they weren't before
      titleBlurHandler();
      descriptionBlurHandler();
      fileBlurHandler();
      return;
    }

    if (!account) {
      try {
        setButtonState({
          class: "btn btn-primary btn-lg btn-block",
          disabled: true,
          text: "Connecting...",
          status: ethTxState.status,
        });
        await activateBrowserWallet(null, true);
      } catch (error) {
        console.log(error);
        setWalletError(true);
        setButtonState({
          class: "btn btn-primary btn-lg btn-block",
          disabled: false,
          text: "Submit NFT blueprint",
          status: ethTxState.status,
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
      status: ethTxState.status,
    });

    const imageIpfsPath = await uploadFileToIPFS(enteredFiles[0]);

    const metadata = {
      name: enteredTitle,
      description: enteredDescription,
      image: "ipfs://" + imageIpfsPath,
    };

    const metadataIpfsPath = await uploadJsonToIPFS(metadata);
    sendCreateBlueprint(metadataIpfsPath);

    resetTitleInput();
    resetDescriptionInput();
    resetFileInput();
  };

  return (
    <div className="container content-container">
      <form onSubmit={formSubmissionHandler}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            name="title"
            id="title"
            onChange={titleChangedHandler}
            onBlur={titleBlurHandler}
            value={enteredTitle}
            placeholder="Your NFT's title"
            className={
              titleInputHasError ? "form-control is-invalid" : "form-control"
            }
          />
          <div className="invalid-feedback">itle must not be empty</div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            name="description"
            id="description"
            onChange={descriptionChangedHandler}
            onBlur={descriptionBlurHandler}
            value={enteredDescription}
            placeholder="Some description"
            className={
              descriptionInputHasError
                ? "form-control is-invalid"
                : "form-control"
            }
          />
          <div className="invalid-feedback">Description must not be empty</div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input
            type="file"
            name="image-file"
            id="image-file"
            onChange={fileChangedHandler}
            onBlur={fileBlurHandler}
            value={enteredFilename}
            className={
              fileInputHasError
                ? "form-control-file is-invalid"
                : "form-control-file"
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

export default NFTNew;
