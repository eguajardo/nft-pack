// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

/**
 * @title Utils
 * @notice Library with utility functions
 */
library Utils {

    /**
     * @dev Returns true if the string is not empty or false otherwise
     */
    function isNotEmptyString(string memory _string) public pure returns (bool) {
        return keccak256(abi.encodePacked(_string)) != keccak256(abi.encodePacked(""));
    }
}