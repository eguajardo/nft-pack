import { uploadFileToIPFS, uploadJsonToIPFS } from "../helpers/ipfs";

import { useState } from "react";
import { useFormFields } from "../hooks/useFormFields";
import { useContractFunction, useEthers } from "@usedapp/core";
import { useContract } from "../hooks/useContract";

import FormGroup from "../components/UI/FormGroup";
import { getVideoPoster } from "../helpers/videoPoster";

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
      label: "Display image (leave blank to use first frame of animation)",
      validator: (field, formFields) => {
        if (
          formFields &&
          (!field.value || field.value.trim() === "") &&
          (!formFields.animation.value ||
            formFields.animation.value.trim() === "")
        ) {
          return "At least a display image or animation needs to be specified!";
        }
      },
    },
    animation: {
      type: "file",
      id: "animation",
      label: "Animation",
      validator: (field, formFields) => {
        console.log("formFields", formFields);
        console.log("formFields.image", formFields?.image);
        if (
          formFields &&
          (!field.value || field.value.trim() === "") &&
          (!formFields.image.value || formFields.image.value.trim() === "")
        ) {
          return "At least a display image or animation needs to be specified!";
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

    let imageFile;
    if (!formFields.image.value || formFields.image.value.trim() === "") {
      console.log("Display image not provided, taking it from animation");
      imageFile = await getVideoPoster(
        URL.createObjectURL(formFields.animation.enteredFiles[0])
      );
    } else {
      imageFile = formFields.image.enteredFiles[0];
    }

    const imageIpfsPath = await uploadFileToIPFS(imageFile);

    const metadata = {
      name: formFields.title.value,
      description: formFields.description.value,
      image: "ipfs://" + imageIpfsPath,
    };

    if (
      formFields.animation.value &&
      formFields.animation.value.trim() !== ""
    ) {
      metadata.animation_url =
        "ipfs://" +
        (await uploadFileToIPFS(formFields.animation.enteredFiles[0]));
    }

    console.log("metadata", metadata);

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
          preview={{
            autoPlay: true,
            loop: true,
            controls: false,
            className: "img-thumbnail mb-4 card-image",
          }}
          valueChangeHandler={createValueChangeHandler("image")}
          inputBlurHandler={createInputBlurHandler("image")}
        />
        <FormGroup
          formField={formFields.animation}
          hasError={hasError(formFields.animation)}
          preview={{
            autoPlay: false,
            loop: true,
            controls: true,
            className: "img-thumbnail mb-4 card-image",
          }}
          valueChangeHandler={createValueChangeHandler("animation")}
          inputBlurHandler={createInputBlurHandler("animation")}
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
