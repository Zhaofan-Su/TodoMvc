// 使用localstorage完成数据持久化
(function () {
    if (!window.localStorage) {
        alert("your device doesn't support the localStorage")
        return false
    } else {
        var model = window.model
        var storage = window.localStorage
        var key = 'todos'
        Object.assign(model, {
            init: function (callback) {
                // 读取localStorage中保存的数据
                var data = storage.getItem(key)
                // 将json字符串转为json对象
                if (data)
                    model.data = JSON.parse(data)

                if (callback) callback()
            },
            flush: function (callback) {
                // 将model.data中的数据转换为json字符串，存储
                storage.setItem(key, JSON.stringify(model.data))
                if (callback) callback()
            }
        })
    }


})()