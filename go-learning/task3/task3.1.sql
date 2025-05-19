## 表结构
students 表包含以下字段：

- id：主键，自增
- name：学生姓名，字符串类型
- age：学生年龄，整数类型
- grade：学生年级，字符串类型

## 插入数据
INSERT INTO students (name, age, grade) 
VALUES ('张三', 20, '三年级');

## 查询数据
SELECT * 
FROM students 
WHERE age > 18;

## 更新数据
UPDATE students
SET grade = '四年级'
WHERE name = '张三';

## 删除数据
DELETE FROM students
WHERE age < 15;