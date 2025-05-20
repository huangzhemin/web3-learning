// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReverseString {
    function reverse(string memory input) public pure returns (string memory) {
        bytes memory strBytes = bytes(input);
        uint len = strBytes.length;
        for (uint i = 0; i < len / 2; i++) {
            bytes1 temp = strBytes[i];
            strBytes[i] = strBytes[len - 1 - i];
            strBytes[len - 1 - i] = temp;
        }
        return string(strBytes);
    }
}