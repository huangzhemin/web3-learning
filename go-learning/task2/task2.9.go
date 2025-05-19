/*
定义一个 Shape 接口，包含 Area() 和 Perimeter() 两个方法。然后创建 Rectangle 和 Circle 结构体，实现 Shape 接口。在主函数中，创建这两个结构体的实例，并调用它们的 Area() 和 Perimeter() 方法。
*/
package main

import (
	"fmt"
	"math"
)

// Shape 接口定义了计算面积和周长的方法
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Rectangle 矩形结构体
type Rectangle struct {
	Width  float64
	Height float64
}

// Area 计算矩形面积
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// Perimeter 计算矩形周长
func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// Circle 圆形结构体
type Circle struct {
	Radius float64
}

// Area 计算圆形面积
func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

// Perimeter 计算圆形周长
func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

// 打印形状信息的辅助函数
func printShapeInfo(s Shape) {
	fmt.Printf("面积: %.2f\n", s.Area())
	fmt.Printf("周长: %.2f\n", s.Perimeter())
}

func main() {
	// 创建矩形实例
	rect := Rectangle{Width: 5, Height: 3}
	fmt.Println("矩形:")
	printShapeInfo(rect)

	// 创建圆形实例
	circle := Circle{Radius: 2.5}
	fmt.Println("\n圆形:")
	printShapeInfo(circle)

	// 使用接口切片存储不同形状
	shapes := []Shape{rect, circle}
	fmt.Println("\n所有形状:")
	for i, shape := range shapes {
		fmt.Printf("形状 %d:\n", i+1)
		printShapeInfo(shape)
		fmt.Println()
	}
}
