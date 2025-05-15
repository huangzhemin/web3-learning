/*
编写一个程序，使用通道实现两个协程之间的通信。一个协程生成从1到10的整数，并将这些整数发送到通道中，另一个协程从通道中接收这些整数并打印出来。
*/
package main

import (
	"fmt"
)

func main() {
	// 创建一个整数通道
	numChan := make(chan int)

	// 启动生产者协程
	go func() {
		// 生成1到10的整数并发送到通道
		for i := 1; i <= 10; i++ {
			numChan <- i
		}
		// 关闭通道
		close(numChan)
	}()

	// 消费者协程（主协程）
	// 从通道接收数据直到通道关闭
	for num := range numChan {
		fmt.Printf("接收到数字: %d\n", num)
	}
}
