"use strict";

// 全局变量定义

// 获取dom元素
var $ = function (ele) {
    return document.querySelector(ele)
}

var $all = function (ele) {
    return document.querySelectorAll(ele)
}

Array.prototype.removeByValue = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1)
            break
        }
    }
}

var toArray = function (fakeArray) {
    var array = []
    fakeArray.forEach(ele => {
        array.push(ele)
    })
    return array
}

// 全局todo_id,todo项目总数
var guid = 0

// 更新整个项目的界面以及数据持久化
function update() {
    model.flush()
    var data = model.data

    // 待办todo项目的个数
    var activeNum = 0

    var todoList = $('#todo-list')
    // 置空
    todoList.innerHTML = ''
    data.todos.forEach(todoData => {
        // 项目还未完成
        if (!todoData.completed)
            activeNum++

        if (data.filter === 'All' ||
            (data.filter === 'Activate' && !todoData.completed) ||
            (data.filter === 'Completed' && todoData.completed)) {
            // 新增dom节点
            var todo = document.createElement('li')
            var id = 'todo' + guid++

            // dom节点增加id属性
            todo.setAttribute('id', id)
            // todo项目已完成
            if (todoData.completed)
                todo.classList.add('completed')

            // 增加dom节点下应有的内容
            // label标签里是todo项目的具体内容
            todo.innerHTML = [
                '<div class="view">',
                '   <input class="toggle" type="checkbox">',
                '   <label class="todo-label">' + todoData.content + '</label>',
                '   <button class="delete"></button>',
                '</div>'
            ].join('')


            // 双击todo项目内容可以直接进行修改
            // 找到todo项目下的label标签，绑定双击事件
            var label = todo.querySelector('.todo-label')
            label.addEventListener('dblclick', function () {
                // todo项目的状态变为正在编辑
                todo.classList.add('editing')

                // 创建一个text类型的input标签，供用户编辑todo项目
                var edit = document.createElement('input')
                edit.setAttribute('type', 'text')
                edit.classList.add('edit')
                // 是否完成编辑
                var finished = false
                edit.setAttribute('value', label.innerHTML)

                // 用户完成编辑
                function finishEdit() {
                    if (finished)
                        return
                    finished = true
                    todo.removeChild(edit)
                    todo.classList.remove('editing')
                }

                // 焦点离开input标签，完成编辑
                // edit.addEventListener('touchend', function () {
                //     // finishEdit()
                //     // 结束编辑
                //     console.log("绑定了吗？")
                //     label.innerHTML = this.value
                //     todoData.content = this.value
                //     update()
                // }, false)
                edit.addEventListener('blur', function () {
                    finishEdit()
                }, false)

                edit.addEventListener('keyup', function (event) {
                    if (event.keyCode === 27) {
                        // 退出按键ESC,结束编辑
                        finishEdit()
                    } else if (event.keyCode === 13) {
                        // 回车键,确定完成编辑
                        // this指的是input标签
                        label.innerHTML = this.value
                        // 保存数据
                        todoData.content = this.value
                        // 数据更新到model中
                        update()
                    }
                }, false)

                todo.appendChild(edit)
                edit.focus()
            }, false)

            // todo项目的dom元素的toggle触发器，保存该todo项目的完成状态
            var toggle = todo.querySelector('.toggle')
            toggle.checked = todoData.completed
            toggle.addEventListener('change', function () {
                // todo项目对应的持久化数据状态切换
                todoData.completed = !todoData.completed
                // todoList状态更新
                update()
            }, false)

            // todo项目的dom节点下的删除按钮绑定删除todo项目事件
            todo.querySelector('.delete').addEventListener('click', function () {
                data.todos.removeByValue(todoData)
                // 更新todoList
                update()
            }, false)

            // 将新的todo项目插入到最前面
            todoList.insertBefore(todo, todoList.firstChild)
        }
    })

    // 用于输入新的todo项目的input
    var newTodo = $('#new-Todo')
    // input输入框内更新为用户已输入的内容（有的话）
    newTodo.value = data.content

    // 统计当前已经完成的todo项目
    var completedNum = data.todos.length - activeNum

    // 统计未完成数目的dom元素
    var count = $('#todo-count')
    count.innerHTML = (activeNum || 'No') + ' ' + (activeNum > 1 ? 'todos' : 'todo') + ' left'

    // 根据是否已经有已完成的todo项目来确定是否要显示清除按钮
    var clearBtn = $('#clear')
    clearBtn.style.visibility = completedNum > 0 ? 'visibile' : 'hidden'

    // 根据是否有todo项目来确定是否显示“完成所有todo项目”的toggle
    var all = $('.all')
    all.style.visibility = data.todos.length > 0 ? 'visibility' : 'hidden'
    all.checked = data.todos.length === completedNum

    // 获取所有的filters，根据用户的选择添加不同的样式
    var filters_fake = $all('#filters li a')
    var filters = toArray(filters_fake)
    filters.forEach(filter => {
        if (data.filter === filter.innerHTML)
            filter.classList.add('selected')
        else
            filter.classList.remove('selected')
    })
}


// 页面载入：获取数据，页面初始化
window.onload = function init() {
    model.init(function () {
        var data = model.data

        var newTodo = $('#new-Todo')
        newTodo.addEventListener('keyup', function () {
            // 用户敲击就键盘，就将当前的input中的内容保存下来
            data.content = newTodo.value
        })

        newTodo.addEventListener('change', function () {
            model.flush()
        })

        newTodo.addEventListener('keyup', function (event) {
            if (event.keyCode != 13)
                // 非回车键，还未结束输入
                return
            if (data.content === '') {
                console.warn('please input your todo~')
                return
            }

            // 用户结束输入，将todo项目保存下来，更新界面
            data.todos.push({
                content: data.content,
                completed: false
            })
            // 当前用户输入内容清空
            data.content = ''
            update()
        }, false)

        // 清空已完成项目的按钮绑定事件
        var clear = $('#clear')
        clear.addEventListener('click', function () {
            // 持久化数据中清除已完成项目
            data.todos.forEach(todo => {
                if (todo.completed)
                    data.todos.removeByValue(todo)
            })
            // 更新界面
            update()
        }, false)

        // 置所有todo项目为已完成的checkbox绑定事件
        var all = $('.all')
        all.addEventListener('change', function () {
            var completed = all.checked
            data.todos.forEach(todo => {
                todo.completed = completed
            })
            update()
        }, false)

        // 每一个filter的事件绑定
        var filters = toArray($all('#filters li a'))
        filters.forEach(filter => {
            filter.addEventListener('click', function () {
                data.filter = filter.innerHTML
                filters.forEach(filter => {
                    filter.classList.remove('selected')
                })
                filter.classList.add('selected')
                update()
            }, false)
        })

        // 更新界面
        update()
    })
}