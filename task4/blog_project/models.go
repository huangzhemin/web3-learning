package main // 或者 package models，如果你想创建一个单独的包

import (
	"time"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	gorm.Model        // 内嵌 gorm.Model，包含 ID, CreatedAt, UpdatedAt, DeletedAt 字段
	Username   string `gorm:"type:varchar(100);uniqueIndex;not null"`
	Password   string `gorm:"type:varchar(255);not null"` // 实际项目中密码应该被哈希存储
	Email      string `gorm:"type:varchar(100);uniqueIndex"`
	Posts      []Post      `gorm:"foreignKey:UserID"` // 一个用户可以有多篇文章
	Comments   []Comment   `gorm:"foreignKey:UserID"` // 一个用户可以有多条评论
}

// Post 博客文章模型
type Post struct {
	gorm.Model        // 内嵌 gorm.Model
	Title      string `gorm:"type:varchar(255);not null"`
	Content    string `gorm:"type:text;not null"`
	UserID     uint   `gorm:"not null"` // 外键，关联 User 的 ID
	User       User   // 属于某个用户 (Belongs To 关系)
	Comments   []Comment `gorm:"foreignKey:PostID"` // 一篇文章可以有多条评论
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Comment 评论模型
type Comment struct {
	gorm.Model        // 内嵌 gorm.Model
	Content    string `gorm:"type:text;not null"`
	UserID     uint   `gorm:"not null"` // 外键，关联 User 的 ID
	User       User   // 属于某个用户 (Belongs To 关系)
	PostID     uint   `gorm:"not null"` // 外键，关联 Post 的 ID
	Post       Post   // 属于某篇文章 (Belongs To 关系)
	CreatedAt  time.Time
}

// 如果你将模型放在单独的 models 包中，上面的 package main 需要改为 package models
// 并且在其他地方引用时需要 import "your_blog_project/models"