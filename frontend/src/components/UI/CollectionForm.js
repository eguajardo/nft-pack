import { utils } from "ethers";
import { uploadFileToIPFS, uploadJsonToIPFS } from "../../helpers/ipfs";

import { useEffect, useState } from "react";
import { useFormFields } from "../../hooks/useFormFields";
import { useContractFunction, useEthers } from "@usedapp/core";
import { useContract } from "../../hooks/useContract";

import FormGroup from "./FormGroup";

function CollectionForm(props) {
  const [walletError, setWalletError] = useState(false);
  const { activateBrowserWallet, account } = useEthers();
  const tokenPackContract = useContract("TokenPack");

  const [buttonState, setButtonState] = useState({
    class: "btn btn-primary btn-lg btn-block",
    disabled: false,
    text: "Submit collection",
  });

  const {
    formFields,
    createValueChangeHandler,
    createInputBlurHandler,
    validateForm,
    hasError,
    resetForm,
  } = useFormFields({
    name: {
      type: "text",
      id: "name",
      label: "Name",
      placeholder: "Your collection's name",
      validator: (field) => {
        if (!field.value || field.value.trim() === "") {
          return "Name must not be empty!";
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
    price: {
      type: "number",
      id: "price",
      label: "Price per pack (MATIC token)",
      step: 0.001,
      validator: (field) => {
        if (!field.value || field.value <= 0) {
          return "Price must be grater than 0!";
        }
      },
    },
    capacity: {
      type: "number",
      id: "capacity",
      label: "Cards per booster pack",
      step: 1,
      validator: (field) => {
        if (!field.value || field.value <= 0) {
          return "Cards per booster must be grater than 0!";
        }
      },
    },
    image: {
      type: "file",
      id: "image",
      label: "Cover Image",
      validator: (field) => {
        if (!field.value || field.value.trim() === "") {
          return "Image is missing!";
        }
      },
    },
  });

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

      resetForm();
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
  }, [ethTxState, resetForm]);

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

    const imageIpfsPath = await uploadFileToIPFS(
      formFields.image.enteredFiles[0]
    );

    const metadata = {
      name: formFields.name.value,
      description: formFields.description.value,
      image: "ipfs://" + imageIpfsPath,
    };

    console.log("selected blueprints:", props.selectedBlueprints);

    const metadataIpfsPath = await uploadJsonToIPFS(metadata);
    sendCreateCollection(
      metadataIpfsPath,
      utils.parseEther(formFields.price.value),
      formFields.capacity.value,
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
        <FormGroup
          formField={formFields.name}
          hasError={hasError(formFields.name)}
          valueChangeHandler={createValueChangeHandler("name")}
          inputBlurHandler={createInputBlurHandler("name")}
        />
        <FormGroup
          formField={formFields.description}
          hasError={hasError(formFields.description)}
          valueChangeHandler={createValueChangeHandler("description")}
          inputBlurHandler={createInputBlurHandler("description")}
        />
        <FormGroup
          formField={formFields.price}
          hasError={hasError(formFields.price)}
          valueChangeHandler={createValueChangeHandler("price")}
          inputBlurHandler={createInputBlurHandler("price")}
        />
        <FormGroup
          formField={formFields.capacity}
          hasError={hasError(formFields.capacity)}
          valueChangeHandler={createValueChangeHandler("capacity")}
          inputBlurHandler={createInputBlurHandler("capacity")}
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

export default CollectionForm;
