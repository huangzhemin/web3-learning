package main

import "fmt"

func main() {
	// 创建无缓冲整型通道
	dataChan := make(chan int)

	// 启动生产者协程
	go func() {
		defer close(dataChan) // 确保发送完成后关闭通道
		for i := 1; i <= 10; i++ {
			dataChan <- i // 发送数据到通道
		}
	}()

	// 主协程充当消费者
	for num := range dataChan { // 自动检测通道关闭
		fmt.Printf("接收: %d\n", num)
	}
}
