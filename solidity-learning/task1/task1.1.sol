// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // 存储候选人得票数的 mapping
    mapping(string => uint256) private votes;

    // 候选人列表
    string[] private candidates;

    // 记录候选人是否已存在
    mapping(string => bool) private candidateExists;

    // 投票函数，允许用户为某个候选人投票
    function vote(string memory candidate) public {
        if (!candidateExists[candidate]) {
            candidates.push(candidate);
            candidateExists[candidate] = true;
        }
        votes[candidate] += 1;
    }

    // 查询某个候选人的得票数
    function getVotes(string memory candidate) public view returns (uint256) {
        return votes[candidate];
    }

    // 重置所有候选人的得票数
    function resetVotes() public {
        for (uint256 i = 0; i < candidates.length; i++) {
            votes[candidates[i]] = 0;
        }
    }
}