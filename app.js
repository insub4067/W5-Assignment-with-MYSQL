const express = require("express");
// const mongoose = require("mongoose");
const { User, Post, Comment } = require("./models");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middlewares/auth-middleware");
const Joi = require("joi");
const ejs = require("ejs");
const path = require("path");
const { response, json } = require("express");
const { fail } = require("assert");
const { Op } = require("sequelize");

// mongoose.connect("mongodb://localhost:27017/admin", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   user: "test",
//   pass: "test",
// });

// mongoose.connect("mongodb://localhost/njs_hw_w5", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// mongoose.set('useFindAndModify', false);

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();


//로그인
router.post("/auth", async(req,res) => {
    const { userId, password } = req.body;

    const user = await User.findOne({ where:  { userId, password } });

    if (!user){
        res.status(400).send({
            errorMessage: '사용자 정보가 일치하지 않습니다'
        });
        return;
    }

    const token = jwt.sign({ userId: user.userId }, "secretKey");
    res.send({
        token,
    });

});

//댓글 본인확인
router.get("/_auth/:id", authMiddleware, async (req, res) => {

    const { id } = req.params;

    _result = await Comment.findOne({ where: {id: id}})

    const userId = res.locals.user.dataValues.userId
    
    if ( _result.userId !== userId) {
        res.status(400).send({
            errorMessage: '사용자가 일치하지 않습니다'
        });
    }else{
        res.status(200).send (_result);

    }

});


//token확인
router.get("/users/me", authMiddleware, async (req, res) => {
    res.send({ user: res.locals.user });
});

//댓글등록
router.post("/comment/:id", authMiddleware, async(req,res) => {
    const { comment } = req.body;
    const { id } = req.params;
    const{ user : { userId } }  = res.locals;

    await Comment.create({ comment, userId, postId: id });
    res.status(201).send({});
});

//댓글가져오기
router.get("/comments/:id", async(req, res) => {
    const { id } = req.params;

    const result = await Comment.findAll({ where: { postId: id } });
    
    res.json({result});
})

//댓글 삭제하기
router.delete('/_delete/:id', async(req,res) => {

    const { id } = req.params

    console.log(id)

    await Comment.destroy({ where: {id: id}})

    res.send({ response : response });

});

//댓글 수정하기
router.put('/_edit/:id', async(req,res) => {

    const id = req.params;

    const comment = req.body.comment

    console.log(req.params, comment)

    await Comment.update({ comment : comment }, { where: id} )

    res.status(200).send({ response : response });

});

//게시글 등록
router.post("/posting", authMiddleware, async(req, res) => {
    const { title, contents } = req.body;
    const userId = res.locals.user.userId

    await Post.create({ title, contents, userId });
    res.status(200).send({});
});

//게시글 가져오기
router.get("/posts", async(req, res) => {
    const result = await Post.findAll();
    // console.log(result[0].dataValues)
    res.json({result});
});

//게시글 본인확인
router.get("/auth/:id", authMiddleware, async (req, res) => {

    const { id } = req.params;

    result = await Post.findByPk(id)

    const{ user:  { userId } }  = res.locals;

    if ( result.userId !== userId) {
        res.status(400).send({
            errorMessage: '사용자가 일치하지 않습니다'
        });
    }else{
        res.status(200).send ({});

    }

});

//게시글 수정
router.put('/edit/:id', async(req,res) => {

    const { title, _id, content } = req.body;

    await Post.update({ title: title, contents: content }, { where: { id: _id }})

    res.send({ response : response });

});

//게시글 삭제
router.delete('/delete/:id', async(req,res) => {

    const { id } = req.params

    await Post.destroy({ where: { id: id } });

    await Comment.destroy({ where: { postId: id } })

    // await Comment.findOneAndDelete({ postId : id })

    res.send({ response : response });

});

//Detail Page 게시물 정보 가지고오기
router.get('/detail/:id', async(req, res) => {
    
    try {
        const { id }  = req.params;

        const result = await Post.findByPk(id)
    
        res.send(result)

    } catch (error) {
        console.error(error);
        next(error);
    }
    
   
})


//회원가입
router.post("/users", async(req, res) => {
    const { userId, password, confirmPassword } = req.body;

    const schema = Joi.object({
        userId: Joi.string()
        .min(3)
        .pattern(new RegExp("^[a-zA-Z0-9]"))
        .required(),
        password: Joi.string()
        .min(4)
        .pattern(new RegExp())
        .required(),
    });


    const { error, value } = schema.validate({ userId: userId, password: password });

    if (error){ 
        res.status(400).send({
            errorMessage: '형식을 확인해 주세요.'
        })

        return;
    }

    if(password === userId){
        res.status(400).send({
            errorMessage: "닉네임과 패스워드가 같습니다."
        })
        return;
    }


    if(password !== confirmPassword){
        res.status(400).send({
            errorMessage: "패스워드가 일치하지 않습니다.",
        })
        return;
    }

    const existUsers = await User.findAll({
        where: {
            [Op.or] : [{ userId }],
        },
    });
    if(existUsers.length) {
        res.status(400).send({
            errorMessage: "이미 가입된 아이디 입니다." 
        });
        return;
    }

    await User.create({ userId, password });

    res.status(201).send({});

});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/test', (req, res) => {
    let name = req.query.name;
    res.render('test', { name });
})

app.get('/', (req, res) => {
    let name = req.query.name;
    res.render('main', { name });
})

app.get('/detail', (req, res) => {
    let name = req.query.name;
    res.render('detail', { name });
})

app.get('/edit', (req, res) => {
    let name = req.query.name;
    res.render('edit', { name });
})

app.get('/write', (req, res) => {
    let name = req.query.name;
    res.render('write', { name });
})

app.get('/register', (req, res) => {
    let name = req.query.name;
    res.render('register', { name });
})

app.get('/login', (req, res) => {
    let name = req.query.name;
    res.render('login', { name });
})

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.json());
app.use(express.static("assets"));



app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});