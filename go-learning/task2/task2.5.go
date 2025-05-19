package main

import (
	"fmt"
	"math"
)

// 定义接口 (包含两个方法签名)
type Shape interface {
	Area() float64
	Perimeter() float64
}

// 长方形结构体
type Rectangle struct {
	Width  float64
	Height float64
}

// 长方形面积实现
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// 长方形周长实现
func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// 圆形结构体
type Circle struct {
	Radius float64
}

// 圆形面积实现
func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

// 圆形周长实现 (数学上称为圆周长)
func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

func main() {
	// 创建具体形状实例
	rect := Rectangle{Width: 5, Height: 3}
	circle := Circle{Radius: 2.5}

	// 通过接口调用方法
	printShapeDetails(rect)
	printShapeDetails(circle)
}

// 通用方法处理所有实现Shape接口的类型
func printShapeDetails(s Shape) {
	// 使用类型断言获取具体类型信息
	switch v := s.(type) {
	case Rectangle:
		fmt.Printf("[长方形] 宽:%.1f 高:%.1f\n", v.Width, v.Height)
	case Circle:
		fmt.Printf("[圆形] 半径:%.1f\n", v.Radius)
	}

	// 统一调用接口方法
	fmt.Printf("面积: %.2f\n周长: %.2f\n\n", s.Area(), s.Perimeter())
}
