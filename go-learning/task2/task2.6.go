package main

import "fmt"

// 基类结构体
type Person struct {
	Name string
	Age  int
}

// 组合结构体
type Employee struct {
	Person     // 通过匿名字段继承Person属性
	EmployeeID string
}

// 员工信息打印方法
func (e Employee) PrintInfo() {
	fmt.Printf(
		"员工信息:\n姓名: %s\n年龄: %d\n工号: %s\n",
		e.Name, // 直接访问嵌入结构体的字段
		e.Age,
		e.EmployeeID,
	)
}

func main() {
	// 初始化员工实例
	developer := Employee{
		Person: Person{
			Name: "张伟",
			Age:  28,
		},
		EmployeeID: "DEV-2023-007",
	}

	// 调用信息打印方法
	developer.PrintInfo()
}
