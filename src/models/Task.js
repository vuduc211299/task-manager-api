const mongoose = require('mongoose')

const taskSchema = mongoose.Schema({
    des : {
        type: String,
        require: true,
        trim : true
    },
    completed : {
        type: Boolean,
        require: false
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref : 'User'
    }
},{
    timestamps : true
})

const Task = mongoose.model('Task',taskSchema)



module.exports = Task