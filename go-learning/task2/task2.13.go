/*
编写一个程序，使用 sync.Mutex 来保护一个共享的计数器。启动10个协程，每个协程对计数器进行1000次递增操作，最后输出计数器的值。
*/
package main

import (
	"fmt"
	"sync"
)

// Counter 结构体，包含一个计数值和一个互斥锁
type Counter struct {
	value int
	mutex sync.Mutex
}

// Increment 方法，对计数器进行递增操作
func (c *Counter) Increment() {
	// 加锁，确保同一时间只有一个协程能访问计数器
	c.mutex.Lock()
	// 完成操作后解锁
	defer c.mutex.Unlock()
	
	// 递增计数器
	c.value++
}

// GetValue 方法，获取计数器的当前值
func (c *Counter) GetValue() int {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	
	return c.value
}

func main() {
	// 创建计数器
	counter := Counter{value: 0}
	
	// 创建等待组，用于等待所有协程完成
	var wg sync.WaitGroup
	
	// 启动10个协程
	for i := 0; i < 10; i++ {
		// 为每个协程添加一个等待计数
		wg.Add(1)
		
		// 启动协程
		go func(id int) {
			// 协程结束时通知等待组
			defer wg.Done()
			
			// 每个协程对计数器进行1000次递增操作
			for j := 0; j < 1000; j++ {
				counter.Increment()
			}
			
			fmt.Printf("协程 %d 完成\n", id)
		}(i)
	}
	
	// 等待所有协程完成
	wg.Wait()
	
	// 输出最终计数器的值
	fmt.Printf("最终计数器的值: %d\n", counter.GetValue())
	
	// 验证结果是否正确（10个协程 × 1000次递增 = 10000）
	if counter.GetValue() == 10000 {
		fmt.Println("计数正确！")
	} else {
		fmt.Println("计数错误！")
	}
}
