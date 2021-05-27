// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./Blueprint.sol";
import "./Utils.sol";

/**
 * @title Token
 * @notice The ERC721 that is hold by packs. Tokens are created from author's blueprints
 */
contract Token is ERC721Enumerable, AccessControlEnumerable {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Blueprint private blueprintContract;

    /**
     * @dev Mapping of token ID to blueprint ID
     */
    mapping (uint256 => uint256) _tokenBlueprints;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` and `minter` for the token.
     */
    constructor (string memory name_, string memory symbol_, address minter) ERC721(name_, symbol_) { 
        _setupRole(MINTER_ROLE, minter);
        blueprintContract = new Blueprint();
    }

    /**
     * @notice Emitted when the 'tokenId' is minted and transfered to the 'owner' using the blueprint id 'blueprintId'
     */
    event Minted(uint256 indexed tokenId, address owner, uint256 indexed blueprintId);

    /**
     * @notice Gets the address of the used ERC721 for minting
     * @return address of the Token contract
     */
    function blueprintContractAddress() external view returns(address) {
        return address(blueprintContract);
    }

    /**
     * @notice Mint a token based on the author's blueprint
     * @param to The address to where the minted token will be transfered
     * @param blueprintId The id of the NFT blueprint
     */
    function mintFromBlueprint(address to, uint256 blueprintId) public virtual {
        require (hasRole(MINTER_ROLE, _msgSender()), "ERROR_UNAUTHORIZED_MINTER");
        require (blueprintContract.exist(blueprintId), "ERROR_INVALID_BLUEPRINT_ID");

        uint256 tokenId = totalSupply();
        _tokenBlueprints[tokenId] = blueprintId;

        _safeMint(to, tokenId);

        emit Minted(tokenId, to, blueprintId);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERROR_INVALID_TOKEN_ID");

        uint256 blueprintId = _tokenBlueprints[tokenId];

        return blueprintContract.blueprintURI(blueprintId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerable, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

}