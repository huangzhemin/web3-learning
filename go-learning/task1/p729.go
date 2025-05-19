type pair struct{ start, end int }
type MyCalendar []pair

func Constructor() MyCalendar {
	return MyCalendar{}
}

func (this *MyCalendar) Book(start int, end int) bool {
	for _, p := range *this {
		if p.start < end && start < p.end {
			return false
		}
	}
	*this = append(*this, pair{start, end})
	return true
}

/**
 * Your MyCalendar object will be instantiated and called as such:
 * obj := Constructor();
 * param_1 := obj.Book(startTime,endTime);
 */