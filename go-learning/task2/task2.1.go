package main

import "fmt"

// increase 函数接收一个整数指针，并将其值增加10
func increase(ptr *int) {
    *ptr += 10
}

func main() {
    num := 5
    increase(&num)          // 传递num的指针给increase函数
    fmt.Println(num)        // 输出修改后的值，结果为15
}
