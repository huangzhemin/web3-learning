func merge(intervals [][]int) [][]int {
	slices.SortFunc(intervals, func(p, q []int) int { return p[0] - q[0] })
	var ans [][]int
	for _, p := range intervals {
		m := len(ans)
		if m > 0 && p[0] <= ans[m-1][1] {
			ans[m-1][1] = max(ans[m-1][1], p[1])
		} else {
			ans = append(ans, p)
		/**
 * Definition for a Node.
 * type Node struct {
 *     Val int
 *     Prev *Node
 *     Next *Node
 *     Child *Node
 * }
 */

func dfs(node *Node) (last *Node){
    cur := node
    for cur != nil {
        next := cur.Next
        if cur.Child != nil {
            childLast := dfs(cur.Child)
            next = cur.Next
            cur.Next = cur.Child
            cur.Child.Prev = cur

            if next != nil {
                childLast.Next = next
                next.Prev = childLast
            }

            cur.Child = nil
            last = childLast
        } else {
            last = cur
        }
        cur = next
    }
    return
}

func flatten(root *Node) *Node {
    dfs(root)
    return root
}}
	}
	return ans
}