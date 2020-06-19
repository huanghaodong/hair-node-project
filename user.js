
// 创建 User 类
class Jwt {
    constructor(data) {
        this.data = data;

    }

    //生成token
    generateToken() {
        let data = this.data;
        let created = Math.floor(Date.now() / 1000);
        let cert = 'hhd';
        let token = jwt.sign({
            data,
            exp: created + 60 * 30,
        }, cert);
        return token;
    }

    // 校验token
    verifyToken() {
        let token = this.data;
        let cert = 'hhd'
        let res;
        try {
            let result = jwt.verify(token, cert) || {};
            let {exp = 0} = result, current = Math.floor(Date.now() / 1000);
            if (current <= exp) {
                res = result.data || {};
            }
        } catch (e) {
            res = 'err';
        }
        return res;
    }
}

module.exports = Jwt;
