/*
实现一个带有缓冲的通道，生产者协程向通道中发送100个整数，消费者协程从通道中接收这些整数并打印。
*/
package main

import (
	"fmt"
)

func main() {
	// 创建一个带缓冲的通道
	ch := make(chan int, 100)

	// 启动生产者协程
	go func() {
		for i := 1; i <= 100; i++ {
			ch <- i
		}
		close(ch) // 生产完成后关闭通道
	}()

	// 消费者从通道接收数据
	for num := range ch {
		fmt.Printf("接收到数字: %d\n", num)
	}
}
