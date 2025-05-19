func merge(intervals [][]int) [][]int {
	slices.SortFunc(intervals, func(p, q []int) int { return p[0] - q[0] })
	var ans [][]int
	for _, p := range intervals {
		m := len(ans)
		if m > 0 && p[0] <= ans[m-1][1] {
			ans[m-1][1] = max(ans[m-1][1], p[1])
		} else {
			ans = append(ans, p)
		}
	}
	return ans
}