function SystemUser(db, cb) {
    return db.define('systemusers', {
        id: Number,
        username: String,
        password: String,
        nick: String,
        avatar: String,
        mail: String,
        birthday: Number,
        token: String,
        status: Number,
        salt: String,
        creation_date: Date
    }, {
        methods: {
            getInfo: function() {
                return {
                    id: this.id,
                    username: this.username,
                    nick: this.nick,
                    avatar: this.avatar,
                    mail: this.mail,
                    birthday: this.birthday,
                    token: this.token,
                    status: this.status
                }
            }
        }
    });
}
module.exports = SystemUser;