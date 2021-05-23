// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

interface ICommonStructs {

    /**
     * @notice Struct representing the key to find a specific blueprint
     */
    struct BlueprintKey {
        address author;
        uint16 blueprint;
    }
}