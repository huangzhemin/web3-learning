package main

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // 假设使用PostgreSQL，也可以替换为其他数据库驱动
)

// Book 结构体，与books表对应
type Book struct {
	ID     int     `db:"id"`     // 书籍ID
	Title  string  `db:"title"`  // 书名
	Author string  `db:"author"` // 作者
	Price  float64 `db:"price"`  // 价格
}

func main() {
	// 连接数据库
	// 注意：请根据实际情况修改连接字符串
	db, err := sqlx.Connect("postgres", "user=postgres password=yourpassword dbname=bookstore sslmode=disable")
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}
	defer db.Close()

	// 查询价格大于50元的书籍
	books, err := queryExpensiveBooks(db, 50.0)
	if err != nil {
		log.Fatalf("查询失败: %v", err)
	}

	// 打印查询结果
	fmt.Printf("找到 %d 本价格大于50元的书籍:\n", len(books))
	for i, book := range books {
		fmt.Printf("%d. ID: %d, 书名: %s, 作者: %s, 价格: %.2f元\n",
			i+1, book.ID, book.Title, book.Author, book.Price)
	}
}

// queryExpensiveBooks 查询价格大于指定值的书籍
func queryExpensiveBooks(db *sqlx.DB, minPrice float64) ([]Book, error) {
	// 定义一个Book结构体切片用于存储结果
	var books []Book

	// 构建SQL查询语句
	query := `
		SELECT id, title, author, price
		FROM books
		WHERE price > $1
		ORDER BY price DESC
	`

	// 执行查询并将结果映射到Book结构体切片
	// Sqlx的Select方法确保了类型安全的映射
	err := db.Select(&books, query, minPrice)
	if err != nil {
		return nil, fmt.Errorf("查询价格大于%.2f元的书籍失败: %w", minPrice, err)
	}

	return books, nil
}
