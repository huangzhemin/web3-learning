// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RomanToInteger {
    function romanToInt(string memory s) public pure returns (uint256) {
        bytes memory str = bytes(s);
        uint256 result = 0;
        uint256 prev = 0;
        for (uint256 i = str.length; i > 0; i--) {
            uint256 value = _romanCharToInt(str[i-1]);
            if (value < prev) {
                result -= value;
            } else {
                result += value;
            }
            prev = value;
        }
        return result;
    }

    function _romanCharToInt(bytes1 c) internal pure returns (uint256) {
        if (c == 'I') return 1;
        if (c == 'V') return 5;
        if (c == 'X') return 10;
        if (c == 'L') return 50;
        if (c == 'C') return 100;
        if (c == 'D') return 500;
        if (c == 'M') return 1000;
        revert("Invalid Roman numeral character");
    }
}
// 示例：
// 输入: "III"，返回: 3
// 输入: "IV"，返回: 4
// 输入: "IX"，返回: 9
// 输入: "LVIII"，返回: 58
// 输入: "MCMXCIV"，返回: 1994