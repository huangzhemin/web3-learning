package main

import (
	"fmt"
	"sync"
	"time"
)

// Schedule 并发执行任务并返回每个任务的执行时间（纳秒精度）
func Schedule(tasks []func()) []time.Duration {
	results := make([]time.Duration, len(tasks))
	var wg sync.WaitGroup
	wg.Add(len(tasks)) // 设置等待计数器

	// 为每个任务创建协程
	for i, task := range tasks {
		go func(index int, t func()) {
			defer wg.Done() // 确保在协程退出时减少计数器
			start := time.Now()
			t() // 执行实际任务
			results[index] = time.Since(start)
		}(i, task) // 注意传递循环变量的拷贝
	}

	wg.Wait() // 阻塞直到所有任务完成
	return results
}

func main() {
	// 示例任务集合
	tasks := []func(){
		mockTask(800 * time.Millisecond),
		mockTask(1 * time.Second),
		mockTask(600 * time.Millisecond),
	}

	// 执行调度并获取时间统计
	durations := Schedule(tasks)

	// 输出格式化结果
	for i, d := range durations {
		fmt.Printf("任务 %d 执行耗时: %v\n", i+1, d.Round(time.Millisecond))
	}
}

// 模拟耗时任务的生成函数
func mockTask(d time.Duration) func() {
	return func() {
		time.Sleep(d) // 模拟处理时长
	}
}
