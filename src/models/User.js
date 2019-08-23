const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/Task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim : true
    },
    age :{
        type: Number,
        require: true,
        trim: true
    },
    password: {
        type: String,
        require: true,
        minLength : 7,
        trim : true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("Password can not contains 'password' ")
            }
        }
    },
    email :{
        type: String,
        unique : true,
        require: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    avatar : {
        type : Buffer
    },
    tokens : [{
        token : {
            type: String, 
            require: true
        }
    }],
    },{
        timestamps : true
    }
)

userSchema.virtual('tasks',{
    ref : 'Task',
    localField : '_id',
    foreignField : 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this   
    const token = jwt.sign({_id : user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    
    return token
}

userSchema.statics.findByCredentials = async (email,password) => {
    const user = await User.findOne({ email })

    if(!user){
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash password before saving new account

userSchema.pre('save', async function (next) {
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }

    next()
})

// Delete all tasks before removing owner

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner : user._id })
    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User
