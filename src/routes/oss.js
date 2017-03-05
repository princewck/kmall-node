var express = require('express');
var router = express.Router();
var OSS = require('ali-oss');
var STS = OSS.STS;
var co = require('co');

//此处只能使用子账号，使用主账号会报错
var sts = new STS({
  accessKeyId: 'LTAINIZKpSOAqocZ',
  accessKeySecret: 'lM7MZyLbwGkDomrm16eSglJ5VpBRwZ'
});

var policy = {
  "Statement": [
    {
      "Action": "oss:*",
      "Effect": "Allow",
      "Resource": "*"
    }
  ],
  "Version": "1"
};

var roleArn = 'acs:ram::1646881312224974:role/kmall-admin';

//获取一个零时的授权对象，有效时间15分钟
router.get('/admin/oss/sts', function(req, res) {
    co(function* () {
      //如果有第二个参数，第二个参数是自定义policy，最终结果取权限的交集
    var token = yield sts.assumeRole(
        roleArn, null, 15 * 60, 'app');
    res.send(token);
    }).catch(function (err) {
    console.log(err);
    res.send(new req.Response(-1, null, '获取权限失败！'));
    });    
});

module.exports = router;