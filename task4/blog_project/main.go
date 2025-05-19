package main

import (
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	DB *gorm.DB
	// JWT 密钥。在生产环境中，这应该从环境变量或安全配置中读取。
	jwtKey = []byte("your_secret_key") // 请务必替换为一个更安全的密钥
)

// Claims 定义了 JWT 中存储的数据
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// 初始化数据库连接
func InitDatabase() {
	var err error
	// 为了简单起见，我们使用 SQLite。文件名可以自定义。
	DB, err = gorm.Open(sqlite.Open("blog.db"), &gorm.Config{})
	if err != nil {
		respondWithError(nil, http.StatusInternalServerError, "无法连接到数据库", err)
		os.Exit(1)
	}

	// 自动迁移数据库表结构
	// 这会根据你的模型创建或更新表
	err = DB.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		respondWithError(nil, http.StatusInternalServerError, "数据库迁移失败", err)
		os.Exit(1)
	}
	log.Println("数据库连接成功并已迁移。")
}

// HashPassword 使用 bcrypt 对密码进行哈希处理
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14) // 14 是 cost 参数
	return string(bytes), err
}

// CheckPasswordHash 验证密码哈希是否与提供的密码匹配
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateJWT 生成一个新的 JWT
func GenerateJWT(user User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // Token 有效期 24 小时
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "your_blog_project", // 可选，签发者
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// 统一错误响应函数
func respondWithError(c *gin.Context, code int, message string, err error) {
	if err != nil {
		log.Printf("错误: %s, 详情: %v", message, err)
	} else {
		log.Printf("错误: %s", message)
	}
	c.JSON(code, gin.H{"error": message})
}

// RegisterHandler 处理用户注册请求
func RegisterHandler(c *gin.Context) {
	var newUser User
	if err := c.ShouldBindJSON(&newUser); err != nil {
		respondWithError(c, http.StatusBadRequest, "无效的请求数据: "+err.Error(), err)
		return
	}

	// 检查用户名是否已存在
	var existingUser User
	if err := DB.Where("username = ?", newUser.Username).First(&existingUser).Error; err == nil {
		respondWithError(c, http.StatusConflict, "用户名已存在", nil)
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		respondWithError(c, http.StatusInternalServerError, "数据库查询错误: "+err.Error(), err)
		return
	}

	// 检查邮箱是否已存在
	if err := DB.Where("email = ?", newUser.Email).First(&existingUser).Error; err == nil {
		respondWithError(c, http.StatusConflict, "邮箱已被注册", nil)
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		respondWithError(c, http.StatusInternalServerError, "数据库查询错误: "+err.Error(), err)
		return
	}

	hashedPassword, err := HashPassword(newUser.Password)
	if err != nil {
		respondWithError(c, http.StatusInternalServerError, "密码加密失败: "+err.Error(), err)
		return
	}
	newUser.Password = hashedPassword

	if result := DB.Create(&newUser); result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, "用户创建失败: "+result.Error.Error(), result.Error)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "用户注册成功", "user_id": newUser.ID, "username": newUser.Username})
}

// LoginHandler 处理用户登录请求
func LoginHandler(c *gin.Context) {
	var loginDetails struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginDetails); err != nil {
		respondWithError(c, http.StatusBadRequest, "无效的请求数据: "+err.Error(), err)
		return
	}

	var user User
	if err := DB.Where("username = ?", loginDetails.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondWithError(c, http.StatusUnauthorized, "用户名或密码错误", nil)
		} else {
			respondWithError(c, http.StatusInternalServerError, "数据库查询错误: "+err.Error(), err)
		}
		return
	}

	if !CheckPasswordHash(loginDetails.Password, user.Password) {
		respondWithError(c, http.StatusUnauthorized, "用户名或密码错误", nil)
		return
	}

	tokenString, err := GenerateJWT(user)
	if err != nil {
		respondWithError(c, http.StatusInternalServerError, "生成 token 失败: "+err.Error(), err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "登录成功", "token": tokenString})
}

// AuthMiddleware 是一个 Gin 中间件，用于验证 JWT
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "请求未包含授权 token"})
			c.Abort()
			return
		}

		// Token 通常以 "Bearer <token>" 的形式提供
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "授权 token 格式错误"})
			c.Abort()
			return
		}
		tokenString := parts[1]

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// 确保 token 的签名算法是我们期望的
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("非预期的签名算法")
			}
			return jwtKey, nil
		})

		if err != nil {
			if errors.Is(err, jwt.ErrTokenExpired) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 已过期"})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的 Token: " + err.Error()})
			}
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的 Token"})
			c.Abort()
			return
		}

		// 将用户信息存储在 Gin 的 Context 中，以便后续处理函数使用
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)

		c.Next() // 继续处理请求
	}
}

// CreatePostHandler 处理创建文章的请求
func CreatePostHandler(c *gin.Context) {
	userID, _ := c.Get("userID")

	var newPost Post
	if err := c.ShouldBindJSON(&newPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// 设置文章作者为当前登录用户
	newPost.UserID = userID.(uint)

	// 保存文章到数据库
	if result := DB.Create(&newPost); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文章创建失败: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "文章创建成功",
		"post_id": newPost.ID,
		"title":   newPost.Title,
	})
}

// GetAllPostsHandler 获取所有文章列表
func GetAllPostsHandler(c *gin.Context) {
	var posts []Post

	// 可以添加分页功能
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 10 // 默认页面大小
	}

	offset := (page - 1) * pageSize

	// 查询文章列表，按创建时间倒序排列
	if err := DB.Order("created_at desc").Limit(pageSize).Offset(offset).Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章列表失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取文章列表成功",
		"posts":   posts,
	})
}

// GetPostByIDHandler 获取单个文章详情
func GetPostByIDHandler(c *gin.Context) {
	postID := c.Param("id")

	var post Post
	// 预加载文章作者和评论信息
	if err := DB.Preload("User").Preload("Comments").Preload("Comments.User").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章详情失败: " + err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取文章详情成功",
		"post":    post,
	})
}

// UpdatePostHandler 更新文章
func UpdatePostHandler(c *gin.Context) {
	postID := c.Param("id")
	userID, _ := c.Get("userID")

	// 检查文章是否存在，以及当前用户是否为文章作者
	var post Post
	if err := DB.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章失败: " + err.Error()})
		}
		return
	}

	// 检查当前用户是否为文章作者
	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "您没有权限更新此文章"})
		return
	}

	// 绑定更新数据
	var updateData struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// 更新文章
	post.Title = updateData.Title
	post.Content = updateData.Content

	if err := DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新文章失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "文章更新成功",
		"post":    post,
	})
}

// DeletePostHandler 删除文章
func DeletePostHandler(c *gin.Context) {
	postID := c.Param("id")
	userID, _ := c.Get("userID")

	// 检查文章是否存在，以及当前用户是否为文章作者
	var post Post
	if err := DB.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章失败: " + err.Error()})
		}
		return
	}

	// 检查当前用户是否为文章作者
	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "您没有权限删除此文章"})
		return
	}

	// 删除文章（GORM 的软删除，实际上是设置 deleted_at 字段）
	if err := DB.Delete(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文章失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "文章删除成功",
	})
}

// CommentCreateRequest 用于创建评论的请求体
type CommentCreateRequest struct {
	Content string `json:"content" binding:"required"`
}

// CommentResponse 用于返回评论信息
type CommentResponse struct {
	ID        uint      `json:"id"`
	Content   string    `json:"content"`
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
}

// 创建评论（需要认证）
func CreateCommentHandler(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID"})
		return
	}

	var req CommentCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未认证"})
		return
	}
	userID := userIDVal.(uint)

	// 检查文章是否存在
	var post Post
	if err := DB.First(&post, postID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}

	// 创建评论
	comment := Comment{
		Content: req.Content,
		PostID:  uint(postID),
		UserID:  userID,
	}
	if err := DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "评论创建失败: " + err.Error()})
		return
	}

	// 获取用户名
	var user User
	DB.First(&user, userID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "评论创建成功",
		"comment": CommentResponse{
			ID:        comment.ID,
			Content:   comment.Content,
			UserID:    comment.UserID,
			Username:  user.Username,
			CreatedAt: comment.CreatedAt,
		},
	})
}

// 获取某篇文章的所有评论（公开接口）
func GetCommentsByPostHandler(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID"})
		return
	}

	var comments []Comment
	if err := DB.Where("post_id = ?", postID).Order("created_at asc").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取评论失败: " + err.Error()})
		return
	}

	// 获取所有评论的用户信息
	userIDs := make([]uint, 0, len(comments))
	for _, cmt := range comments {
		userIDs = append(userIDs, cmt.UserID)
	}
	var users []User
	DB.Where("id IN ?", userIDs).Find(&users)
	userMap := make(map[uint]string)
	for _, u := range users {
		userMap[u.ID] = u.Username
	}

	resp := make([]CommentResponse, 0, len(comments))
	for _, cmt := range comments {
		resp = append(resp, CommentResponse{
			ID:        cmt.ID,
			Content:   cmt.Content,
			UserID:    cmt.UserID,
			Username:  userMap[cmt.UserID],
			CreatedAt: cmt.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"comments": resp})
}

func main() {
	// 初始化数据库
	InitDatabase()

	// 创建 Gin 引擎
	r := gin.Default()

	// 公共路由组 (不需要认证)
	public := r.Group("/api/v1")
	{
		public.POST("/register", RegisterHandler)
		public.POST("/login", LoginHandler)

		// 公开的文章查询接口
		public.GET("/posts", GetAllPostsHandler)
		public.GET("/posts/:id", GetPostByIDHandler)
		// 新增：获取某篇文章的所有评论
		public.GET("/posts/:id/comments", GetCommentsByPostHandler)
	}

	// 受保护的路由组 (需要认证)
	protected := r.Group("/api/v1")
	protected.Use(AuthMiddleware()) // 应用认证中间件
	{
		// 个人资料路由
		protected.GET("/profile", func(c *gin.Context) {
			userID, _ := c.Get("userID")
			username, _ := c.Get("username")
			c.JSON(http.StatusOK, gin.H{
				"message":  "这是受保护的个人资料区域",
				"user_id":  userID,
				"username": username,
			})
		})

		// 文章管理接口
		protected.POST("/posts", CreatePostHandler)
		protected.PUT("/posts/:id", UpdatePostHandler)
		protected.DELETE("/posts/:id", DeletePostHandler)
		// 新增：创建评论
		protected.POST("/posts/:id/comments", CreateCommentHandler)
	}

	// 启动 HTTP 服务器
	log.Println("服务器正在启动，监听端口 :8080...")
	if err := r.Run(":8080"); err != nil {
		respondWithError(nil, http.StatusInternalServerError, "无法启动服务器", err)
	}
}
