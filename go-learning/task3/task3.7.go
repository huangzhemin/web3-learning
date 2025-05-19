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
	PostCount  int    `gorm:"default:0"` // 添加文章数量统计字段
}

// Post 模型
type Post struct {
	gorm.Model
	Title         string    `gorm:"not null"`
	Content       string    `gorm:"type:text;not null"`
	UserID        uint      // 外键，关联到 User 的 ID
	User          User      // 文章属于一个用户 (属于关系)
	Comments      []Comment // 一篇文章可以有多个评论 (一对多)
	CommentStatus string    `gorm:"default:'无评论'"` // 添加评论状态字段
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

// AfterCreate 钩子函数，在创建Post后自动更新用户的文章数量
func (p *Post) AfterCreate(tx *gorm.DB) (err error) {
	// 更新用户的文章数量
	err = tx.Model(&User{}).Where("id = ?", p.UserID).
		UpdateColumn("post_count", gorm.Expr("post_count + ?", 1)).Error

	if err != nil {
		return err
	}

	// 更新文章的评论状态为"无评论"
	err = tx.Model(p).Update("comment_status", "无评论").Error
	return
}

// AfterCreate 钩子函数，在创建Comment后更新文章的评论状态
func (c *Comment) AfterCreate(tx *gorm.DB) (err error) {
	// 更新文章的评论状态为"有评论"
	return tx.Model(&Post{}).Where("id = ?", c.PostID).
		Update("comment_status", "有评论").Error
}

// AfterDelete 钩子函数，在删除Comment后检查文章的评论数量
func (c *Comment) AfterDelete(tx *gorm.DB) (err error) {
	var count int64

	// 查询文章的评论数量
	if err = tx.Model(&Comment{}).Where("post_id = ?", c.PostID).Count(&count).Error; err != nil {
		return err
	}

	// 如果评论数量为0，则更新文章的评论状态为"无评论"
	if count == 0 {
		return tx.Model(&Post{}).Where("id = ?", c.PostID).
			Update("comment_status", "无评论").Error
	}

	return nil
}

func main() {
	// 连接到 SQLite 数据库
	dsn := "gorm_blog.db"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}

	fmt.Println("数据库连接成功!")

	// 自动迁移模式，GORM 会自动创建表、缺失的外键、约束、列和索引
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		log.Fatalf("无法迁移数据库表: %v", err)
	}

	fmt.Println("数据库表迁移成功!")

	// 创建一个用户
	newUser := User{Name: "张三", Email: "zhangsan@example.com"}
	result := db.Create(&newUser)
	if result.Error != nil {
		log.Fatalf("创建用户失败: %v", result.Error)
	}
	fmt.Printf("创建用户成功, ID: %d\n", newUser.ID)

	// 为用户创建一篇文章 - 这将触发 Post 的 AfterCreate 钩子
	newPost := Post{Title: "我的第一篇文章", Content: "这是文章内容...", UserID: newUser.ID}
	postResult := db.Create(&newPost)
	if postResult.Error != nil {
		log.Fatalf("创建文章失败: %v", postResult.Error)
	}
	fmt.Printf("创建文章成功, ID: %d\n", newPost.ID)

	// 查询用户信息，验证 PostCount 是否已更新
	var user User
	db.First(&user, newUser.ID)
	fmt.Printf("用户 %s 的文章数量: %d\n", user.Name, user.PostCount)

	// 为文章添加评论 - 这将触发 Comment 的 AfterCreate 钩子
	newComment := Comment{Content: "很棒的文章！", PostID: newPost.ID, UserID: newUser.ID}
	commentResult := db.Create(&newComment)
	if commentResult.Error != nil {
		log.Fatalf("创建评论失败: %v", commentResult.Error)
	}
	fmt.Printf("创建评论成功, ID: %d\n", newComment.ID)

	// 查询文章信息，验证 CommentStatus 是否已更新
	var post Post
	db.First(&post, newPost.ID)
	fmt.Printf("文章 '%s' 的评论状态: %s\n", post.Title, post.CommentStatus)

	// 删除评论 - 这将触发 Comment 的 AfterDelete 钩子
	db.Delete(&newComment)
	fmt.Println("评论已删除")

	// 再次查询文章信息，验证 CommentStatus 是否已更新为"无评论"
	db.First(&post, newPost.ID)
	fmt.Printf("删除评论后，文章 '%s' 的评论状态: %s\n", post.Title, post.CommentStatus)
}
