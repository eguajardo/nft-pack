import IPFS from "ipfs-api";

const ipfsWriter = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

const ipfsReader = {
  host: "dweb.link",
  protocol: "https",
};

/**
 * Reads the file as Buffer
 *
 * @param {File} file The file object to read as Buffer
 * @returns a Promise<Buffer> with the file read
 */
const readFileAsBuffer = (file) => {
  const reader = new window.FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException("Error reading file"));
    };

    reader.onload = () => {
      resolve(Buffer(reader.result));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Reads a file and uploads it to IPFS
 *
 * @param {File} file The file object to upload to IPFS
 * @returns the IPFS path where the file was uploaded
 */
export const uploadFileToIPFS = async (file) => {
  const fileBuffer = await readFileAsBuffer(file);

  const response = await ipfsWriter.files.add(fileBuffer);

  console.log("IPFS file uploaded:", response);
  return response[0].path;
};

/**
 * Uploads an object to IPFS
 *
 * @param {object} json The object to upload
 * @returns the IPFS path where the object was uploaded
 */
export const uploadJsonToIPFS = async (json) => {
  const jsonString = JSON.stringify(json, null, 2);

  const response = await ipfsWriter.add(Buffer.from(jsonString));

  console.log("IPFS JSON uploaded:", response);
  return response[0].path;
};

/**
 * Loads a JSON from IPFS
 *
 * @param {string} ipfsPath The IPFS path
 * @returns a JSON object loaded from the specified IPFS path
 */
export const loadJsonFromIPFS = async (ipfsPath) => {
  ipfsPath = ipfsPath.replace("ipfs://", "");
  const utf8decoder = new TextDecoder();
  let ipfsMessage = utf8decoder.decode(await ipfsWriter.cat(ipfsPath));

  // Mock response during tests to avoid exceeding limit restrictions on host
  // let ipfsMessage = JSON.stringify({
  //   "name": "Test title",
  //   "description": "test description",
  //   "image": "ipfs://QmVkcP3917y9ZURreM8c2MJCTGhsmGx8NRPzFSG6i7rdBF"
  // }, null, 2);

  console.log("IPFS message retrieved:", ipfsMessage);
  return JSON.parse(ipfsMessage);
};

/**
 * Generates a URL from ipfs config and specified ipfs path
 * e.g from `ipfs://someIpfsPath` to `http://ipfs.infura.io:5001/ipfs/someIpfsPath`
 *
 * @param {string} ipfsPath The IPFS path
 * @returns a string representing the resulting URL
 */
export const ipfsPathToURL = (ipfsPath) => {
  if (ipfsPath) {
    return `${ipfsReader.protocol}://${ipfsReader.host}/ipfs/${ipfsPath.replace(
      "ipfs://",
      ""
    )}`;
  } else {
    return ipfsPath;
  }
};
