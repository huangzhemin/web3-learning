func mySqrt(x int) int {
	ans := -1
	for left, right := 0, x; left <= right; {
		mid := left + (right-left)/2
		if mid*mid <= x {
			ans = mid
			left = mid + 1
		} else {
			right = mid - 1
		}
	}
	return ans
}