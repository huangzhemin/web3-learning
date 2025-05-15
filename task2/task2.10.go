/*
使用组合的方式创建一个 Person 结构体，包含 Name 和 Age 字段，再创建一个 Employee 结构体，组合 Person 结构体并添加 EmployeeID 字段。为 Employee 结构体实现一个 PrintInfo() 方法，输出员工的信息。
*/
package main

import (
	"fmt"
)

// Person 结构体，包含基本个人信息
type Person struct {
	Name string
	Age  int
}

// Employee 结构体，组合 Person 结构体并添加 EmployeeID 字段
type Employee struct {
	Person     // 匿名字段，组合 Person 结构体
	EmployeeID string
}

// PrintInfo 方法，输出员工的信息
func (e Employee) PrintInfo() {
	fmt.Printf("员工信息:\n")
	fmt.Printf("姓名: %s\n", e.Name) // 可以直接访问 Person 的字段
	fmt.Printf("年龄: %d\n", e.Age)  // 可以直接访问 Person 的字段
	fmt.Printf("员工ID: %s\n", e.EmployeeID)
}

func main() {
	// 创建 Employee 实例
	emp := Employee{
		Person: Person{
			Name: "张三",
			Age:  30,
		},
		EmployeeID: "EMP001",
	}

	// 调用 PrintInfo 方法输出员工信息
	emp.PrintInfo()

	// 也可以直接修改 Person 的字段
	fmt.Println("\n修改员工信息后:")
	emp.Name = "张三丰" // 直接访问 Person 的 Name 字段
	emp.Age = 35     // 直接访问 Person 的 Age 字段
	emp.PrintInfo()

	// 创建另一个员工
	emp2 := Employee{
		Person: Person{
			Name: "李四",
			Age:  25,
		},
		EmployeeID: "EMP002",
	}

	fmt.Println("\n另一个员工信息:")
	emp2.PrintInfo()
}
