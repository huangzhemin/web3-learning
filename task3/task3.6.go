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
	// 连接到 SQLite 数据库
	dsn := "gorm_blog.db"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}

	fmt.Println("数据库连接成功!")

	// 自动迁移模式
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		log.Fatalf("无法迁移数据库表: %v", err)
	}

	// 查询某个用户发布的所有文章及其对应的评论信息
	userID := uint(1) // 假设我们要查询ID为1的用户
	var user User

	// 使用Preload预加载用户的文章和文章的评论
	result := db.Preload("Posts.Comments").First(&user, userID)
	if result.Error != nil {
		log.Fatalf("查询用户及其文章和评论失败: %v", result.Error)
	}

	// 打印用户信息
	fmt.Printf("用户ID: %d, 名称: %s, 邮箱: %s\n", user.ID, user.Name, user.Email)

	// 打印用户的文章和评论信息
	for _, post := range user.Posts {
		fmt.Printf("\n文章ID: %d, 标题: %s\n", post.ID, post.Title)
		fmt.Printf("内容: %s\n", post.Content)

		fmt.Println("评论列表:")
		if len(post.Comments) == 0 {
			fmt.Println("  - 暂无评论")
		} else {
			for _, comment := range post.Comments {
				fmt.Printf("  - 评论ID: %d, 内容: %s\n", comment.ID, comment.Content)
			}
		}
	}

	// 查询评论数量最多的文章信息
	var mostCommentedPost Post

	// 使用子查询和连接查询找出评论数量最多的文章
	subQuery := db.Model(&Comment{}).
		Select("post_id, count(*) as comment_count").
		Group("post_id").
		Order("comment_count DESC").
		Limit(1)

	db.Joins("JOIN (?) AS comment_counts ON posts.id = comment_counts.post_id", subQuery).
		Preload("Comments").
		Preload("User").
		First(&mostCommentedPost)

	fmt.Println("\n评论数量最多的文章:")
	fmt.Printf("文章ID: %d, 标题: %s\n", mostCommentedPost.ID, mostCommentedPost.Title)
	fmt.Printf("作者: %s, 评论数量: %d\n", mostCommentedPost.User.Name, len(mostCommentedPost.Comments))
}

// 查询评论数量最多的文章信息
func queryMostCommentedPost(db *gorm.DB) Post {
	var post Post

	// 方法1：使用子查询和连接
	subQuery := db.Model(&Comment{}).
		Select("post_id, count(*) as comment_count").
		Group("post_id").
		Order("comment_count DESC").
		Limit(1)

	db.Joins("JOIN (?) AS comment_counts ON posts.id = comment_counts.post_id", subQuery).
		Preload("Comments").
		Preload("User").
		First(&post)

	// 方法2：使用原生SQL（如果上面的方法在某些数据库中不支持）
	// db.Raw(`
	//     SELECT posts.* FROM posts
	//     LEFT JOIN (
	//         SELECT post_id, COUNT(*) as comment_count
	//         FROM comments
	//         GROUP BY post_id
	//     ) AS comment_counts ON posts.id = comment_counts.post_id
	//     ORDER BY comment_counts.comment_count DESC
	//     LIMIT 1
	// `).Scan(&post)
	//
	// // 加载关联数据
	// db.Preload("Comments").Preload("User").First(&post, post.ID)

	return post
}
