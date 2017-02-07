var str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+~-=:{}<>?[];,./|'.split('');
var letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var num = '1234567890';
var gen = function(length, str) {
        length = Number(length) || 8;
        var rt = '';
        for(var i = length;i;i--) {
            var index = Math.floor(str.length*Math.random());
            rt += str[index];
        };
        return rt;
}
module.exports = {
    string: function(length) {
        return gen(length, str);
    },
    letters: function(length) {
        return gen(length, letters);
    },
    number: function(length) {
        return gen(length, num);
    }
}