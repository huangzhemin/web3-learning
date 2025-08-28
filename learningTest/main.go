package main

import "fmt"

type Animal interface {
	Speak() string
	Move() string
}

type Dog struct{}

func (d Dog) Speak() string {
	return "Woof"
}
func (d Dog) Move() string {
	return "Run"
}

func main() {
	dog := Dog{}
	var a Animal = dog
	fmt.Println(dog.Speak())
	fmt.Println(a.Speak())
}
