/*
使用原子操作（ sync/atomic 包）实现一个无锁的计数器。启动10个协程，每个协程对计数器进行1000次递增操作，最后输出计数器的值。
*/
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	// 定义一个int64类型的计数器
	var counter int64
	// 使用WaitGroup等待所有goroutine完成
	var wg sync.WaitGroup

	// 启动10个goroutine
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// 每个goroutine进行1000次递增操作
			for j := 0; j < 1000; j++ {
				// 使用atomic.AddInt64进行原子递增操作
				atomic.AddInt64(&counter, 1)
			}
		}()
	}

	// 等待所有goroutine完成
	wg.Wait()
	// 输出最终计数器的值
	fmt.Printf("最终计数器的值: %d\n", counter)
}
