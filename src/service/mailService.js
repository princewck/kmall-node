// load nodemailer as follows
// npm install nodemailer --save

var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    "host": "smtpdm.aliyun.com",
    "port": 25,
    "secureConnection": true, // use SSL
    "auth": {
        "user": 'xxxxxxxx', // user name
        "pass": 'xxxxxxxx'         // password
    }
});

// // setup e-mail data with unicode symbols
// var mailOptions = {
//     from: 'NickName<username@userdomain>', // sender address mailfrom must be same with the user
//     to: 'x@x.com, xx@xx.com', // list of receivers
//     cc:'haha<xxx@xxx.com>', // copy for receivers
//     bcc:'haha<xxxx@xxxx.com>', // secret copy for receivers
//     subject: 'Hello', // Subject line
//     text: 'Hello world', // plaintext body
//     html: '<b>Hello world</b><img src="cid:01" style="width:200px;height:auto">' // html body
// };

function Mailer() {
    //最简单的邮件发送接口
    this.send = function(from, to, subject, text, html, cb) {
        if (!to || (!text && !html)) {
            console.error('发信参数不正确!')
            if (cb) cb(false);
        }
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: from || 'master@cybpet.com', // sender address mailfrom must be same with the user
            to: to, // list of receivers
            subject: subject || '来自' + from + '的邮件' // Subject line
        };
        if (text) mailOptions.text = text;
        if (html) mailOptions.html = html;
        this._send(mailOptions, cb);
    };

    /*========================
        下面其实是生成邮件模板的接口，每个方法对应一个options
    */

    //发送注册邮件
    this.sendRegisterCode = function(userId) {
        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    };

    //发送找回密码邮件
    this.sendFetchAccountCode = function(userId) {

    }

    //todos
    //发送返利到账邮件
    //发送重置密码提醒
    //发送订阅邮件
}

Mailer.prototype._send = function(options, cb) {
    transporter.sendMail(options, function(error, info){
        if(error) {
            console.log(error);
            if (cb) cb(false);
            return;
        }
        console.log('Message sent: ' + info.response);
        if (cb) cb(info.response);
    });
}

module.exports = Mailer;