package main

import "fmt"

// 修改切片元素的核心逻辑
func doubleSlice(slicePtr *[]int) {
	// 通过指针解引用获取原始切片
	s := *slicePtr
	// 遍历切片，修改每个元素的值
	for i := range s {
		s[i] *= 2
	}
}

func main() {
	// 初始化测试数据
	nums := []int{1, 2, 3, 4, 5}

	// 通过指针传递切片给函数
	doubleSlice(&nums)

	// 输出结果验证：[2 4 6 8 10]
	fmt.Println(nums)
}
