// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BinarySearch {
    // 在有序 uint 数组中查找目标值 target，找到返回索引，未找到返回 -1
    function binarySearch(uint[] memory arr, uint target) public pure returns (int) {
        int left = 0;
        int right = int(arr.length) - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[uint(mid)] == target) {
                return mid;
            } else if (arr[uint(mid)] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}