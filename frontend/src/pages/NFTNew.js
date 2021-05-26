import { useRef, useState } from 'react';
import { uploadFileToIPFS } from '../utils/ipfs-utils'

function NFTNew() {
  const titleInputRef = useRef();
  const descriptionInputRef = useRef();
  const fileInputRef = useRef();

  const [enteredTitleIsValid, setEnteredTitleIsValid] = useState(true);
  const [enteredDescriptionIsValid, setEnteredDescriptionIsValid] = useState(true);
  const [enteredFileIsValid, setEnteredFileIsValid] = useState(true);

  const formSubmissionHandler = async (event) => {
    event.preventDefault();

    const enteredTitle = titleInputRef.current.value;
    const enteredDescription = descriptionInputRef.current.value;
    const enteredFile = fileInputRef.current.files[0];

    let error = false;

    if (enteredTitle.trim() === '') {
        setEnteredTitleIsValid(false);
        error = true;
    } else {
        setEnteredTitleIsValid(true);
    }
    if (enteredDescription.trim() === '') {
        setEnteredDescriptionIsValid(false);
        error = true;
    } else {
        setEnteredDescriptionIsValid(true);
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

    const ipfsPath = await uploadFileToIPFS(enteredFile);
    
    titleInputRef.current.value = '';
    descriptionInputRef.current.value = '';
    fileInputRef.current.value = '';
  };

  return (
    <div className="container content-container">
      <form onSubmit={formSubmissionHandler}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            ref={titleInputRef}
            type="text"
            name="title"
            id="title"
            placeholder="Your NFT's title"
            className={enteredTitleIsValid ? "form-control" : "form-control is-invalid"}
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
            className={enteredDescriptionIsValid ? "form-control" : "form-control is-invalid"}
          />
          <div className="invalid-feedback">Description must not be empty</div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input
            ref={fileInputRef}
            type="file"
            name="image-file"
            id="image-file"
            className={enteredFileIsValid ? "form-control-file" : "form-control-file is-invalid"}
            accept="image/*"
          />
          <div className="invalid-feedback">Image is missing!</div>
        </div>

        <div id="actions" className="mt-4">
          <button name="submit" className="btn btn-primary btn-lg btn-block">
            Submit NFT blueprint
          </button>
        </div>
      </form>
    </div>
  );
}

export default NFTNew;
