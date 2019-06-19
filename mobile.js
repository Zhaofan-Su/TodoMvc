"use strict";

// 全局变量定义
var deviceWidth = window.screen.width
var deviceHeight = window.screen.height

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

var getTime = function () {
  var date = new Date()
  var year = date.getFullYear()
  var month = date.getMonth()
  if (month < 10)
    month = '0' + month
  var day = date.getDate()
  if (day < 10)
    day = '0' + day
  var hour = date.getHours()
  if (hour < 10)
    hour = '0' + hour
  var minute = date.getMinutes()
  if (minute < 10)
    minute = '0' + minute
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
}
var colorContainer = ['aqua', '#f9d770', '#80DEEA', '#eea2a4', '#B39DDB', '#e16c96']

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

  // 点击事件
  var oldTouch
  // 触碰的元素
  var touchDom
  // 默认左滑不删除元素
  var del = false

  var num = 0
  data.todos.forEach(todoData => {
    num++
    // 项目还未完成
    if (!todoData.completed)
      activeNum++

    if (data.filter === 'All' ||
      (data.filter === 'Active' && !todoData.completed) ||
      (data.filter === 'Completed' && todoData.completed)) {
      // 新增dom节点
      var todo = document.createElement('li')
      var id = 'todo' + guid++
      // 设置其颜色
      todo.style.backgroundColor = colorContainer[(num - 1) % colorContainer.length]
      // dom节点增加id属性
      todo.setAttribute('id', id)
      // todo项目已完成
      if (todoData.completed)
        todo.classList.add('completed')

      // 增加dom节点下应有的内容
      // label标签里是todo项目的具体内容
      todo.innerHTML = [
        '<div class="time">' + todoData.time + '</div>',
        '<div class="view">',
        '   <label class="todo-label">' + todoData.content + '</label>',
        '   <input class="toggle" type="checkbox">',
        '</div>'
      ].join('')

      // 滑动事件绑定
      todo.addEventListener('touchstart', function (event) {
        oldTouch = event.touches[0]
        touchDom = event.currentTarget
      }, false)
      // 左右滑删除
      todo.addEventListener('touchmove', function (event) {
        var newTouch = event.touches[0]
        var verticalOffset = newTouch.clientY - oldTouch.clientY
        // 非上下滑动
        if (Math.abs(verticalOffset) < 5) {
          var offset = newTouch.clientX - oldTouch.clientX
          if (Math.abs(offset) < deviceWidth / 2.5) {
            touchDom.style.transition = 'all 0.2s'
            touchDom.style.left = offset + 'px'
          } else {
            del = true
            touchDom.style.transition = 'all 1.2s ease-in'
            if (offset < 0)
              // 左滑
              touchDom.style.left = -deviceWidth * 4 + 'px'
            else
              // 右滑
              touchDom.style.left = deviceWidth * 4 + 'px'
            setTimeout(function () {
              data.todos.removeByValue(todoData)
              update()
            }, 1000)

          }
        }

      }, false)
      todo.addEventListener('touchend', function (event) {
        if (!del) {
          touchDom.style.left = 0
        }
        touchDom = null
        oldTouch = null
      }, false)

      // todo项目未被完成时，单击todo项目内容可以直接进行修改
      // 找到todo项目下的label标签，绑定单击事件
      if (!todo.classList.contains('completed')) {
        var label = todo.querySelector('.todo-label')
        label.addEventListener('click', function () {
          $('#add').style.display = 'none'
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
            $('#add').style.display = ''
          }

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
              if (this.value === '') {
                alert('Please input your todo~')
              } else {
                label.innerHTML = this.value
                // 保存数据
                todoData.time = getTime()
                todoData.content = this.value
              }
              // 数据更新到model中
              update()
            }
          }, false)

          todo.appendChild(edit)
          edit.focus()
        }, false)
      }

      // todo项目的dom元素的toggle触发器，保存该todo项目的完成状态
      var toggle = todo.querySelector('.toggle')
      toggle.checked = todoData.completed
      toggle.addEventListener('change', function () {
        // todo项目对应的持久化数据状态切换
        todoData.completed = !todoData.completed
        // todoList状态更新
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

  // 用户选择查看已完成项目时，才允许删除
  if (data.filter === 'Completed' && completedNum > 0) {

    // 根据是否已经有已完成的todo项目来确定是否要显示清除按钮
    $('#add').style.display = 'none'
    $('#clear').style.display = ''
  } else {
    $('#add').style.display = ''
    $('#clear').style.display = 'none'
  }

  // 当前是否有todo项目
  if (data.todos.length === 0)
    $('#nothing').style.display = ''
  else
    $('#nothing').style.display = 'none'
}

var _Height
var _Width
// 页面载入：获取数据，页面初始化
window.onload = function init() {
  // 用于后续监听软键盘的弹出与回收
  _Height = document.body.clientHeight
  _Width = document.body.clientWidth
  model.init(function () {
    var data = model.data
    // 添加新todo项目的右下角button的事件绑定
    var addBtn = $('#add')
    var outModel = $('#out-model')
    addBtn.addEventListener('click', function () {
      addBtn.style.display = 'none'
      $('#nothing').style.display = 'none'
      outModel.style.display = 'block'
      // 自动弹出软键盘
      $('#new-Todo').focus()
    }, false)

    var oldTouch
    // 添加todo项目button的移动
    addBtn.addEventListener('touchstart', function (event) {
      oldTouch = event.touches[0]
    }, false)
    addBtn.addEventListener('touchmove', function (event) {
      var newTouch = event.touches[0]
      var dleft = newTouch.clientX - oldTouch.clientX
      var dtop = newTouch.clientY - oldTouch.clientY
      var left = parseFloat(addBtn.offsetLeft || 0) + dleft
      var top = parseFloat(addBtn.offsetTop || 0) + dtop
      // 判断与周围的碰撞,四周留空白
      if (left >= 10 && top >= (80 + $('#header').style.height) && left <= (_Width - 70) && top <= (_Height - 115)) {
        addBtn.style.left = left + 'px'
        addBtn.style.top = top + 'px'
      }
      oldTouch = event.touches[0]
    }, false)
    addBtn.addEventListener('touchend', function (event) {

    }, false)



    var newTodo = $('#new-Todo')
    var ok = $('#ok')
    var cancel = $('#cancel')
    ok.addEventListener('click', function () {
      // 用户确定添加todo项目
      if (data.content === '') {
        console.warn('please input your todo~')
        alert('please input your todo~')
        return
      }
      var time = getTime()
      // 用户结束输入，将todo项目保存下来，更新界面
      data.todos.push({
        time: time,
        content: data.content,
        completed: false
      })
      outModel.style.display = 'none'
      addBtn.style.display = 'block'
      // 当前用户输入内容清空
      data.content = ''
      update()
      // addBtn.classList.remove('out')
    }, false)

    cancel.addEventListener('click', function () {
      outModel.style.display = 'none'
      addBtn.style.display = 'block'
      data.content = ''
      update()
    }, false)

    newTodo.addEventListener('keyup', function () {
      // 用户敲击就键盘，就将当前的input中的内容保存下来
      data.content = newTodo.value
    }, false)

    newTodo.addEventListener('change', function () {
      model.flush()
    }, false)

    newTodo.addEventListener('keyup', function (event) {
      if (event.keyCode != 13)
        // 非回车键，还未结束输入
        return
      if (data.content === '') {
        console.warn('please input your todo~')
        alert('please input your todo~')
        return
      }
      var time = getTime()
      // 用户结束输入，将todo项目保存下来，更新界面
      data.todos.push({
        time: time,
        content: data.content,
        completed: false
      })

      outModel.style.display = 'none'
      addBtn.style.display = 'block'
      // 当前用户输入内容清空
      data.content = ''
      update()
    }, false)

    // 清空已完成项目的按钮绑定事件
    var clear = $('#clear')
    clear.addEventListener('click', function () {
      // 持久化数据中清除已完成项目
      var all = data.todos.slice()
      all.forEach(todo => {
        if (todo.completed)
          data.todos.removeByValue(todo)
      })
      all = null
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

// 监听软键盘的变化，安卓上需要解决一些问题
window.onresize = function resize() {
  // 解决软键盘挡到输入框的问题
  if (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA") {
    setTimeout(function () {
      var top = document.activeElement.get
      var top = document.activeElement.getBoundingClientRect().top
      window.scrollTo(0, top)
    }, 0)
  }

  // 解决软键盘上顶footer的问题
  if (document.body.clientHeight < _Height) {
    $('#bottom').style.display = 'none'
    $('#main').style.bottom = '0'
    $('#add').style.display = 'none'
  } else {
    $('#bottom').style.display = ''
    $('#main').style.bottom = '45px'
    $('#add').style.display = ''

    // 判断此时是否处在编辑状态下， 软键盘收起时，自动退出编辑模式
    if (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA") {
      var liNode = document.activeElement.parentNode
      liNode.classList.remove('editing')
      liNode.removeChild(document.activeElement)
    }
  }

}