/**
 * Definition for a Node.
 * type Node struct {
 *     Val int
 *     Prev *Node
 *     Next *Node
 *     Child *Node
 * }
 */

func dfs(node *Node) (last *Node) {
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
}