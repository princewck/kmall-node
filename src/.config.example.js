/**
 * copy and edit this file to `./.config.js` to make it work
 */
module.exports = {
    ossAccount: {
        accessKeyId: '<oss accessKeyId>',
        accessKeySecret: '<oss accessKeySecret>'
    },
    ossRoleArn: '<oss role arn 即要扮演的角色>',
    mysqlConfig: "mysql://root:@localhost/kmall?pool=true",
    mysqlPoolConfig: {
        host: '192.168.0.0',
        user: 'root',
        password: '',
        database: 'kmall',
        port: 3306
    },
    sessionMysqlStorageConfig: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'kmall_session'
    },    
    alimamaConfig: {
        'appkey': '123456',
        'appsecret': 'xxxx',
        'REST_URL': 'http://gw.api.taobao.com/router/rest'
    },
    mail: {
        "host": "smtpdm.aliyun.com",
        "port": 25,
        "secureConnection": true, // use SSL
        "auth": {
            "user": 'master@xxxx.com', // user name
            "pass": 'xxxxxx'         // password
        }
    }    
}