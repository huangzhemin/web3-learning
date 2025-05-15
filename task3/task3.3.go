package main

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // 或其他数据库驱动，如 _ "github.com/go-sql-driver/mysql"
)

// Employee 结构体，映射数据库表字段
type Employee struct {
	ID         int     `db:"id"`
	Name       string  `db:"name"`
	Department string  `db:"department"`
	Salary     float64 `db:"salary"`
}

func main() {
	// 连接数据库，这里使用PostgreSQL作为示例
	// 如果使用MySQL，连接字符串格式会不同
	db, err := sqlx.Connect("postgres", "user=postgres password=password dbname=company sslmode=disable")
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}
	defer db.Close()

	// 查询技术部员工
	techEmployees := queryTechDepartmentEmployees(db)
	fmt.Println("技术部员工:")
	for _, emp := range techEmployees {
		fmt.Printf("ID: %d, 姓名: %s, 部门: %s, 工资: %.2f\n",
			emp.ID, emp.Name, emp.Department, emp.Salary)
	}

	// 查询工资最高的员工
	highestPaidEmployee := queryHighestPaidEmployee(db)
	fmt.Println("\n工资最高的员工:")
	fmt.Printf("ID: %d, 姓名: %s, 部门: %s, 工资: %.2f\n",
		highestPaidEmployee.ID, highestPaidEmployee.Name,
		highestPaidEmployee.Department, highestPaidEmployee.Salary)
}

// 查询技术部的所有员工
func queryTechDepartmentEmployees(db *sqlx.DB) []Employee {
	var employees []Employee

	// 使用Sqlx的Select方法查询并直接映射到结构体切片
	err := db.Select(&employees, "SELECT id, name, department, salary FROM employees WHERE department = $1", "技术部")
	if err != nil {
		log.Fatalf("查询技术部员工失败: %v", err)
	}

	return employees
}

// 查询工资最高的员工
func queryHighestPaidEmployee(db *sqlx.DB) Employee {
	var employee Employee

	// 使用Sqlx的Get方法查询单条记录并映射到结构体
	err := db.Get(&employee, "SELECT id, name, department, salary FROM employees ORDER BY salary DESC LIMIT 1")
	if err != nil {
		log.Fatalf("查询工资最高的员工失败: %v", err)
	}

	return employee
}
