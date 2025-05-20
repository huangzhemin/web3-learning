// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IntegerToRoman {
    function intToRoman(uint256 num) public pure returns (string memory) {
        require(num > 0 && num < 4000, "输入范围: 1-3999");
        string[13] memory romans = [
            "M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"
        ];
        uint256[13] memory values = [
            uint256(1000), 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1
        ];
        string memory result = "";
        for (uint256 i = 0; i < 13; i++) {
            while (num >= values[i]) {
                result = string(abi.encodePacked(result, romans[i]));
                num -= values[i];
            }
        }
        return result;
    }
}
// 示例：
// 输入: 3749，返回: "MMMDCCXLIX"
// 输入: 58，返回: "LVIII"
// 输入: 1994，返回: "MCMXCIV"