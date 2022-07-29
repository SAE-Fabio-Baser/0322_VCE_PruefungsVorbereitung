import express from "express"
import jwt from "jsonwebtoken"
import sendEmail from "./sendEmail.js";
import path from "path"

const SECRET = "benno"
const PORT = 3000

const app = express()

app.use(express.json())

const db = new Map()

app.post("/register", (req, res) => {
    const {username, password, email} = req.body

    const alreadyExists = db.has(username)

    if (alreadyExists) {
        res.json({code: "usernameUnavailable"})
    } else {
        const newUser = {
            username,
            email,
            password: password // TODO: encrypt password
        }

        db.set(username, newUser)

        res.json({
            code: "userCreated",
            data: {
                user: newUser
            }
        })
    }
})

app.post("/login", (req, res) => {

    const {username, password} = req.body

    const userExists = db.has(username)

    if (!userExists) {
        res.json({code: "wrongCredentials"})
    } else {
        const user = db.get(username)

        const correctPassword = user.password === password // TODO: encrypt given password

        if (!correctPassword) {
            res.json({code: "wrongCredentials"})
        } else {

            const payload = {
                iat: Date.now(),
                username: user.username
            }

            // Generate & Send Token
            const token = jwt.sign(payload, SECRET)
            res.json({code: "loggedIn", data: {token}})
        }
    }
})

app.get("/forgot", (req,res) => {
    res.sendFile(path.resolve("./forgot.html"))
})

app.post("/sendForgotEmail", (req, res) => {
    const { username } = req.body

    const userExists = db.has(username)

    if (!userExists) {
        res.json({code: "emailSent"})
        return
    }

    const payload = {
        iat: Date.now(),
        username,
    }

    const emailToken = jwt.sign(payload, SECRET)

    const user = db.get(username)

    user.currentEmailToken = emailToken
    console.log(emailToken)

    db.set(username, user)

    res.json({code: "emailSent"})

    // Send Email
    sendEmail(user.email, emailToken)
})

app.get("/forgot/verify/:emailToken", (req, res) => {
    const { emailToken } = req.params

    if (!emailToken) {
        res.send({code: "noEmailToken"})
        return
    }

    try {
        const payload = jwt.verify(emailToken, SECRET)
        const user = db.get(payload.username)

        if (user?.currentEmailToken !== emailToken) {
            res.json({code: "invalidEmailToken"})
            return
        }

        res.json({code: "validEmailToken"})
    } catch (err) {
        res.json({code: "invalidEmailToken"})
    }

})

app.post("/reset-password/:emailToken", (req, res) => {

    const { newPassword } = req.body
    const { emailToken } = req.params

    if (!emailToken) {
        res.send({code: "noEmailToken"})
        return
    }

    try {
        const payload = jwt.verify(emailToken, SECRET)
        const user = db.get(payload.username)

        if (!user) {
            res.json({code: "invalidEmailToken"})
            return
        }

        if (user?.currentEmailToken !== emailToken) {
            res.json({code: "invalidEmailToken"})
            return
        }

        user.password = newPassword // TODO: Encrypt new Passwd
        db.set(user.username, user)

        res.json({code: "passwordChanged"})
    } catch (err) {
        res.json({code: "invalidEmailToken"})
    }


})

app.get("/posts", (req, res) => {

    const {authorization} = req.headers

    if (!authorization) {
        res.json({code: "noAuthHeader"})
        return
    }

    const [bearer, token] = authorization.split(" ")

    if (bearer !== "Bearer") {
        res.json({code: "authHeaderNotBearer"})
        return;
    }

    try {
        const payload = jwt.verify(token, SECRET)

        const userExists = db.has(payload.username)

        if (!userExists) {
            res.json({code: "invalidToken"})
        } else {
            // Token is valid
            console.log(payload)

            res.json({
                data: {
                    posts: ["post1", "post2"]
                }
            })
        }

    } catch (err) {
        console.err(err)
        res.json({code: "invalidToken"})
    }
})

app.listen(PORT, () => {
    console.log("Server running on Port http://localhost:" + PORT)
})