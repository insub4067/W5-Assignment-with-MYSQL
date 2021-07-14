const jwt = require("jsonwebtoken");
const { User } = require("../models");


module.exports = async(req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(" ");

    if(tokenType !== 'Bearer'){
        res.status(401).send({
            errorMessage: '로그인 후 사용하세요'
        });
        return;
    };



    try {
        const { userId } = jwt.verify(tokenValue, "secretKey");

        await User.findOne({ where: { userId: userId }}).then((user) => {
            res.locals.user = user;
            next();
        });

        
    } catch (error) {
        res.status(401).send({
            errorMessage: '로그인 후 사용하세요' 
            });   
            return;
    }

};