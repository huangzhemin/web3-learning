package main

import (
	"fmt"
	"sync"
)

// 打印奇数协程
func printOdd(wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 1; i <= 10; i += 2 {
		fmt.Printf("奇数: %d\n", i)
	}
}

// 打印偶数协程
func printEven(wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 2; i <= 10; i += 2 {
		fmt.Printf("偶数: %d\n", i)
	}
}

func main() {
	var wg sync.WaitGroup
	wg.Add(2) // 设置等待2个协程

	go printOdd(&wg)  // 启动奇数协程
	go printEven(&wg) // 启动偶数协程

	wg.Wait() // 等待所有协程完成
}
