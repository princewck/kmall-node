module.exports = function toUnicode(s) {
    return s.replace(/([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/g, function () {
        return "\\u" + RegExp["$1"].charCodeAt(0).toString(16);
    });
}