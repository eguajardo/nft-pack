import { uploadFileToIPFS, uploadJsonToIPFS } from "../helpers/ipfs";

import { useState } from "react";
import { useFormFields } from "../hooks/useFormFields";
import { useContractFunction, useEthers } from "@usedapp/core";
import { useContract } from "../hooks/useContract";

import FormGroup from "../components/UI/FormGroup";

function NFTNew() {
  const [walletError, setWalletError] = useState(false);
  const { activateBrowserWallet, account } = useEthers();
  const blueprintContract = useContract("Blueprint");

  const [buttonState, setButtonState] = useState({
    class: "btn btn-primary btn-lg btn-block",
    disabled: false,
    text: "Submit NFT blueprint",
    status: "None",
  });

  const {
    formFields,
    createValueChangeHandler,
    createInputBlurHandler,
    validateForm,
    hasError,
    resetForm,
  } = useFormFields({
    title: {
      type: "text",
      id: "title",
      label: "Title",
      placeholder: "Your NFT's title",
      validator: (field) => {
        if (!field.value || field.value.trim() === "") {
          return "Title must not be empty!";
        }
      },
    },
    description: {
      type: "text",
      id: "description",
      label: "Description",
      placeholder: "Some description",
      validator: (field) => {
        if (!field.value || field.value.trim() === "") {
          return "Description must not be empty!";
        }
      },
    },
    image: {
      type: "file",
      id: "image",
      label: "Image",
      validator: (field) => {
        if (!field.value || field.value.trim() === "") {
          return "Image is missing!";
        }
      },
    },
  });

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

    if (!validateForm()) {
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

    const imageIpfsPath = await uploadFileToIPFS(
      formFields.image.enteredFiles[0]
    );

    const metadata = {
      name: formFields.title.value,
      description: formFields.description.value,
      image: "ipfs://" + imageIpfsPath,
    };

    const metadataIpfsPath = await uploadJsonToIPFS(metadata);
    sendCreateBlueprint(metadataIpfsPath);

    resetForm();
  };

  return (
    <div className="container content-container">
      <form onSubmit={formSubmissionHandler}>
        <FormGroup
          formField={formFields.title}
          hasError={hasError(formFields.title)}
          valueChangeHandler={createValueChangeHandler("title")}
          inputBlurHandler={createInputBlurHandler("title")}
        />
        <FormGroup
          formField={formFields.description}
          hasError={hasError(formFields.description)}
          valueChangeHandler={createValueChangeHandler("description")}
          inputBlurHandler={createInputBlurHandler("description")}
        />
        <FormGroup
          formField={formFields.image}
          hasError={hasError(formFields.image)}
          previewClass="img-thumbnail mb-4"
          valueChangeHandler={createValueChangeHandler("image")}
          inputBlurHandler={createInputBlurHandler("image")}
        />

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
