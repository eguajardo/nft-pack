import IPFS from 'ipfs-api';

const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

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
        }

        reader.onload = () => {
            resolve(Buffer(reader.result));
        }

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Reads a file and uploads it to IPFS
 * 
 * @param {File} file The file object to upload to IPFS
 * @returns the IPFS path where the file was uploaded
 */
export const uploadFileToIPFS = async (file) => {
    const fileBuffer = await readFileAsBuffer(file);

    const response = await ipfs.files.add(fileBuffer);

    console.log("IPFS file uploaded:", response);
    return response[0].path;
}

/**
 * Uploads an object to IPFS
 * 
 * @param {object} json The object to upload
 * @returns the IPFS path where the object was uploaded
 */
export const uploadJsonToIPFS = async (json) => {
    const jsonString = JSON.stringify(json, null, 2);

    const response = await ipfs.add(Buffer.from(jsonString));

    console.log("IPFS JSON uploaded:", response);
    return response[0].path;
}

export default ipfs;