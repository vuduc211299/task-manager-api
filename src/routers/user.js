const multer = require('multer')
const expresss = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const sharp = require('sharp')
const router = new expresss.Router()

router.post('/users',async (req,res)=>{
    // Save new user into database
    const user = new User(req.body);
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user,token })
    } catch (err) {
        res.status(400).send(err)
    }

})

router.post('/users/login', async (req,res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user , token})
    }catch(error){
        res.status(400).send()
    }
})

router.post('/users/logout',auth, async (req,res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.status(200).send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/logoutAll',auth, async (req,res) => {
    try {
        req.user.tokens = []; // empty array of tokens
        await req.user.save()
        res.status(200).send()
    } catch (error) {
        res.status(500).send()
    }
})

// router (path, middleware, handle req)
// Reading

router.get('/users/me', auth , async (req,res)=>{
    res.send(req.user)
})


const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter( req, file, cb ) {
        if(!file.originalname.match(/\.(jpg|png)$/)) {
            return cb(new Error('Please upload images'))
        }

        cb(undefined, true)

        // cb(new Error('File must be a PDF'))
        // cb(undefined, true)
        // cb(undefined, false)
    }
})

router.get('/users/:id/avatar', async (req,res) =>{
    try {
        const user = await User.findOne({_id: req.params.id})
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.send(error)
    }
   
})

router.post('/users/me/avatar', auth ,upload.single('avatar') , async ( req, res )=>{
    const buffer = await sharp(req.file.buffer).resize({height: 250, width: 250}).png().toBuffer()
    
    req.user.avatar = buffer
    await req.user.save()
    res.send(req.user)
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async ( req, res )=>{
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send(req.user)
    } catch (error) {
        res.send(error)
    }
    
})

// Update 
router.patch('/users/me', auth,  async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'})
        
    }

    try{
        const user = await User.findById(req.user._id)
        if(!user){
            res.status(404).send("Don't have any user with id " + _id)
        }
        updates.forEach((update) => user[update] = req.body[update])

        await user.save()

        res.status(200).send(user)
    }catch(err){
        res.status(400).send(err)
    }
})

//delete 

router.delete('/users/me', auth ,async (req,res) => {
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    } catch (error) {
        res.send(500).send()
    }

})

module.exports = router