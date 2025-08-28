package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// 本示例演示 Go 语言中 channel 的常见用法：
// 1) 无缓冲 channel 的发送与接收（需要发送方与接收方“同步”配合）
// 2) 有缓冲 channel（异步队列，容量决定阻塞边界）
// 3) 关闭 channel 与 range 遍历（优雅结束消费者）
// 4) select + 超时（避免永久阻塞）
// 5) 一个简单的 worker pool（工作池）实战示例
// 6) 单向 channel（只写/只读约束接口）
// 7) context 取消（优雅停止 goroutine）
// 8) 管道流水线（generator -> processor -> consumer）

func demoUnbuffered() {
	fmt.Println("\n== 无缓冲 channel ==")

	// 无缓冲 channel：容量为 0，发送和接收必须同时发生，否则会阻塞
	ch := make(chan string)

	go func() {
		// 模拟耗时的生产
		time.Sleep(300 * time.Millisecond)
		ch <- "hello from unbuffered"
		fmt.Println("发送完成（无缓冲）")
	}()

	// 没有接收前，上面的发送会阻塞在 ch <- ... 处
	msg := <-ch
	fmt.Println("接收到:", msg)
}

func demoBuffered() {
	fmt.Println("\n== 有缓冲 channel ==")

	// 有缓冲 channel：容量为 2，允许先连续发送 2 个元素而不阻塞
	ch := make(chan int, 2)

	ch <- 1
	fmt.Println("已发送: 1")
	ch <- 2
	fmt.Println("已发送: 2")

	// 若再发送一个，将会阻塞，直到有接收发生
	go func() {
		time.Sleep(200 * time.Millisecond)
		fmt.Println("接收:", <-ch)
		fmt.Println("接收:", <-ch)
	}()

	// 这里第三次发送会先阻塞，等待上面的 goroutine 消费一个元素后才继续
	ch <- 3
	fmt.Println("已发送: 3（此前可能发生过短暂阻塞）")
}

func demoCloseAndRange() {
	fmt.Println("\n== 关闭 channel 与 range 遍历 ==")

	ch := make(chan int)

	go func() {
		for i := 1; i <= 5; i++ {
			ch <- i
		}
		// 生产完成，关闭 channel；关闭表示“不会再有新数据了”
		close(ch)
	}()

	// 使用 range 自动从 channel 取值，直到 channel 被关闭且数据耗尽
	for v := range ch {
		fmt.Println("收到:", v)
	}
	fmt.Println("channel 已关闭并遍历完毕")
}

func demoSelectTimeout() {
	fmt.Println("\n== select + 超时 ==")

	ch := make(chan string)

	go func() {
		// 模拟不确定的耗时任务（可能比超时更慢）
		delay := time.Duration(800) * time.Millisecond
		time.Sleep(delay)
		ch <- fmt.Sprintf("任务完成（耗时 %v）", delay)
	}()

	select {
	case msg := <-ch:
		fmt.Println("收到:", msg)
	case <-time.After(500 * time.Millisecond):
		fmt.Println("等待超时（> 500ms 未收到结果）")
	}
}

// workerPool 展示一个最简工作池：
// - jobs: 投递任务
// - results: 收集结果
// - 有固定数量的 worker 从 jobs 中取任务并处理，将结果写入 results
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs { // 当 jobs 关闭且取完后，循环结束
		// 模拟工作耗时
		time.Sleep(100 * time.Millisecond)
		fmt.Printf("worker %d 处理任务 %d\n", id, j)
		results <- j * j
	}
}

func demoWorkerPool() {
	fmt.Println("\n== worker pool 示例 ==")

	const (
		numJobs    = 5
		numWorkers = 2
	)

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	var wg sync.WaitGroup
	wg.Add(numWorkers)
	for w := 1; w <= numWorkers; w++ {
		go worker(w, jobs, results, &wg)
	}

	// 投递任务后关闭 jobs，通知 worker“没有新任务了”
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	// 等待所有 worker 退出，再关闭 results
	go func() {
		wg.Wait()
		close(results)
	}()

	// 消费计算结果
	for res := range results {
		fmt.Println("结果:", res)
	}
}

// ====== 6) 单向 channel（只写/只读）======
// producer 只能向外写（chan<-），consumer 只能从外读（<-chan），
// 通过函数签名限制误用，提高并发代码的可读性与安全性。
func producer(out chan<- int, n int) {
	for i := 1; i <= n; i++ {
		out <- i
	}
	close(out)
}

func consumer(in <-chan int) {
	for v := range in {
		fmt.Println("consumer 收到:", v)
	}
	fmt.Println("consumer 完成")
}

func demoDirectionalChannels() {
	fmt.Println("\n== 单向 channel（只写/只读） ==")
	ch := make(chan int, 3)
	go producer(ch, 5)
	consumer(ch)
}

// ====== 7) context 取消（优雅停止 goroutine）======
// 工作协程监听 ctx.Done()，一旦上层取消/超时，协程即可停止，避免泄漏。
func cancellableWorker(ctx context.Context, id string, tick time.Duration) {
	for {
		select {
		case <-ctx.Done():
			fmt.Println("worker", id, "收到取消:", ctx.Err())
			return
		case <-time.After(tick):
			fmt.Println("worker", id, "tick")
		}
	}
}

func demoContextCancel() {
	fmt.Println("\n== context 取消 ==")

	// 方式一：手动取消
	ctx1, cancel1 := context.WithCancel(context.Background())
	go cancellableWorker(ctx1, "A", 150*time.Millisecond)
	time.Sleep(400 * time.Millisecond)
	cancel1() // 通知 A 停止

	// 方式二：超时取消
	ctx2, cancel2 := context.WithTimeout(context.Background(), 350*time.Millisecond)
	defer cancel2()
	go cancellableWorker(ctx2, "B", 120*time.Millisecond)
	// 等待 B 自行因超时退出
	time.Sleep(600 * time.Millisecond)
}

// ====== 8) 管道流水线（pipeline）======
// generator: 生成 1..n
func generator(n int) <-chan int {
	out := make(chan int)
	go func() {
		for i := 1; i <= n; i++ {
			out <- i
		}
		close(out)
	}()
	return out
}

// square: 对输入每个数字求平方
func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for v := range in {
			out <- v * v
		}
		close(out)
	}()
	return out
}

// filterOdd: 过滤掉奇数，只保留偶数
func filterOdd(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for v := range in {
			if v%2 == 0 {
				out <- v
			}
		}
		close(out)
	}()
	return out
}

func demoPipeline() {
	fmt.Println("\n== 管道流水线 ==")
	// pipeline: 1..8 -> square -> filterOdd
	g := generator(8)
	sq := square(g)
	out := filterOdd(sq)
	for v := range out {
		fmt.Println("流水线输出:", v)
	}
}

func testOverflow() {
	ch := make(chan int, 1)
	ch <- 1
	// ch <- 2
	fmt.Println(<-ch)
}

func main() {
	rand.Seed(time.Now().UnixNano())

	demoUnbuffered()
	demoBuffered()
	demoCloseAndRange()
	demoSelectTimeout()
	demoWorkerPool()

	// 新增演示
	demoDirectionalChannels()
	demoContextCancel()
	demoPipeline()

	testOverflow()
}
