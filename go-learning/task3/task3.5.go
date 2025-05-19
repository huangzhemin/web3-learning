package main

import (
	"fmt"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// User 模型
type User struct {
	gorm.Model        // 内嵌 gorm.Model，包含 ID, CreatedAt, UpdatedAt, DeletedAt
	Name       string `gorm:"not null"`
	Email      string `gorm:"unique;not null"`
	Posts      []Post // 一个用户可以有多篇文章 (一对多)
}

// Post 模型
type Post struct {
	gorm.Model
	Title    string    `gorm:"not null"`
	Content  string    `gorm:"type:text;not null"`
	UserID   uint      // 外键，关联到 User 的 ID
	User     User      // 文章属于一个用户 (属于关系)
	Comments []Comment // 一篇文章可以有多个评论 (一对多)
}

// Comment 模型
type Comment struct {
	gorm.Model
	Content string `gorm:"type:text;not null"`
	PostID  uint   // 外键，关联到 Post 的 ID
	Post    Post   // 评论属于一篇文章 (属于关系)
	UserID  uint   // 外键，评论也属于一个用户 (可选，但常见)
	User    User   // 评论者 (可选)
}

func main() {
	// 连接到 SQLite 数据库 (gorm_blog.db 文件将会被创建)
	// 你也可以使用 "file::memory:?cache=shared" 来创建一个内存数据库
	dsn := "gorm_blog.db"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}

	fmt.Println("数据库连接成功!")

	// 自动迁移模式，GORM 会自动创建表、缺失的外键、约束、列和索引
	// 注意: AutoMigrate 只会创建表，不会删除未使用的列，以保护你的数据
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		log.Fatalf("无法迁移数据库表: %v", err)
	}

	fmt.Println("数据库表迁移成功!")

	// 可以在这里添加一些创建数据和查询的示例代码

	// 例如，创建一个用户
	newUser := User{Name: "张三", Email: "zhangsan@example.com"}
	result := db.Create(&newUser)
	if result.Error != nil {
		log.Fatalf("创建用户失败: %v", result.Error)
	}
	fmt.Printf("创建用户成功, ID: %d\n", newUser.ID)

	// 例如，为用户创建一篇文章
	newPost := Post{Title: "我的第一篇文章", Content: "这是文章内容...", UserID: newUser.ID}
	postResult := db.Create(&newPost)
	if postResult.Error != nil {
		log.Fatalf("创建文章失败: %v", postResult.Error)
	}
	fmt.Printf("创建文章成功, ID: %d\n", newPost.ID)

	// 例如，为文章添加评论
	newComment := Comment{Content: "很棒的文章！", PostID: newPost.ID, UserID: newUser.ID} // 假设评论也关联用户
	commentResult := db.Create(&newComment)
	if commentResult.Error != nil {
		log.Fatalf("创建评论失败: %v", commentResult.Error)
	}
	fmt.Printf("创建评论成功, ID: %d\n", newComment.ID)
}
