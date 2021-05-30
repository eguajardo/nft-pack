// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Context.sol";

import "./Utils.sol";

/**
 * @title Blueprint
 * @notice Contract handling token blueprints
 * @dev Contract based on openzeppelin's ERC721Enumerable
 */
contract Blueprint is Context {

    /**
     * @dev Array storing all blueprint IPFS metadata paths
     */
    string[] private _blueprintsIpfs;

    /**
     * @dev Mapping from author to list of authored blueprint IDs
     */
    mapping(address => uint256[]) private _authoredBlueprints;

     /**
     * @notice Emitted when the 'author' creates the blueprint with ID 'blueprintId' and index 'authorBlueprintIndex'
     */
    event BlueprintCreated(address indexed author, uint256 indexed blueprintId, uint256 indexed authorBlueprintIndex);

    /**
     * @notice Creates a new token blueprint
     * @param ipfsPath The IPFS path to compose the tokenURI of the NFT's created by this blueprint
     * @return blueprint ID
     */
    function createBlueprint(string calldata ipfsPath) external returns (uint256) {
        require (Utils.isNotEmptyString(ipfsPath), "ERROR_EMPTY_IPFS_PATH");

        uint256 blueprintId = _blueprintsIpfs.length;
        uint256 authorBlueprintId = _authoredBlueprints[_msgSender()].length;

        _blueprintsIpfs.push(ipfsPath);
        _authoredBlueprints[_msgSender()].push(blueprintId);

        emit BlueprintCreated(_msgSender(), blueprintId, authorBlueprintId);
        return blueprintId;
    }

    /**
     * @dev Returns a blueprint ID authored by `author` at a given `index` of its blueprint list.
     */
    function blueprintOfAuthorByIndex(address author, uint256 index) external view returns (uint256) {
        require(index < _authoredBlueprints[author].length, "ERROR_INVALID_INDEX");
        return _authoredBlueprints[author][index];
    }

    /**
     * @notice Returns the total amount of blueprints stored by the contract.
     */
    function totalBlueprints() external view returns (uint256) {
        return _blueprintsIpfs.length;
    }

    /**
     * @notice Blueprint URI pointing to it's metadata.
     */
    function blueprintURI(uint256 blueprintId) external view returns (string memory) {
        require(exist(blueprintId), "ERROR_INVALID_BLUEPRINT_ID");
        return string(abi.encodePacked("ipfs://", _blueprintsIpfs[blueprintId]));
    }

    function exist(uint256 blueprintId) public view returns (bool) {
        return blueprintId < _blueprintsIpfs.length;
    }

}