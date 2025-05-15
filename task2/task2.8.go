/*
设计一个任务调度器，接收一组任务（可以用函数表示），并使用协程并发执行这些任务，同时统计每个任务的执行时间。
*/
package main

import (
	"fmt"
	"sync"
	"time"
)

// Task 表示一个可执行的任务
type Task struct {
	ID       int
	Execute  func()        // 任务执行函数
	Duration time.Duration // 执行时间
}

// TaskScheduler 任务调度器
type TaskScheduler struct {
	tasks []*Task
}

// NewTaskScheduler 创建一个新的任务调度器
func NewTaskScheduler() *TaskScheduler {
	return &TaskScheduler{
		tasks: make([]*Task, 0),
	}
}

// AddTask 添加一个任务到调度器
func (ts *TaskScheduler) AddTask(id int, execute func()) {
	task := &Task{
		ID:      id,
		Execute: execute,
	}
	ts.tasks = append(ts.tasks, task)
}

// RunAll 并发执行所有任务并统计执行时间
func (ts *TaskScheduler) RunAll() {
	var wg sync.WaitGroup

	// 为每个任务启动一个协程
	for _, task := range ts.tasks {
		wg.Add(1)

		go func(t *Task) {
			defer wg.Done()

			// 记录开始时间
			startTime := time.Now()

			// 执行任务
			t.Execute()

			// 计算执行时间
			t.Duration = time.Since(startTime)
		}(task)
	}

	// 等待所有任务完成
	wg.Wait()
}

// PrintResults 打印所有任务的执行结果
func (ts *TaskScheduler) PrintResults() {
	fmt.Println("任务执行结果:")
	for _, task := range ts.tasks {
		fmt.Printf("任务 ID: %d, 执行时间: %v\n", task.ID, task.Duration)
	}
}

func main() {
	// 创建任务调度器
	scheduler := NewTaskScheduler()

	// 添加一些示例任务
	scheduler.AddTask(1, func() {
		fmt.Println("执行任务 1")
		time.Sleep(100 * time.Millisecond)
	})

	scheduler.AddTask(2, func() {
		fmt.Println("执行任务 2")
		time.Sleep(200 * time.Millisecond)
	})

	scheduler.AddTask(3, func() {
		fmt.Println("执行任务 3")
		time.Sleep(150 * time.Millisecond)
	})

	// 执行所有任务
	scheduler.RunAll()

	// 打印结果
	scheduler.PrintResults()
}
