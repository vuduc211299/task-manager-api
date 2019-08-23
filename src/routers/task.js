const Task = require('../models/Task')
const express = require('express')
const auth = require('../middleware/auth')
const router = express.Router()

// GET /tasks?completed=true
// GET /task?limit=10&skip=0
// GET /tasks/sortBy=createdAt:desc

router.get('/tasks',auth,async (req,res)=>{
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        var part = req.query.sortBy.split(':')
        sort[part[0]] = part[1] === 'desc' ? -1 : 1 
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.status(200).send(req.user.tasks)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post('/tasks', auth, async (req,res)=>{
    try{
        const task = new Task({
            ...req.body,
            owner : req.user._id
        })
        await task.save()
        res.status(201).send(task)
    } catch(error){
        res.status(400).send()
    }
})
router.get('/tasks/:id',auth, async (req,res) => {
    try {
        const task = await Task.findOne({_id : req.params.id , owner : req.user._id})
        if(!task){
            res.status(404).send()
        }

        res.status(200).send(task)
    } catch (error) {
        res.send(error)
    }
})

router.patch('/tasks/:id',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['des','completed']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send()
    }
    try{
        const task = await Task.findOne({_id: req.params.id , owner : req.user._id})
        updates.forEach((update)=> task[update] = req.body[update])
        await task.save()
        
        if(!task){
            return res.status(404).send()
        }

        if(!task){
            res.status(404).send()
        }

        res.status(200).send(task)
    }catch(error){
        res.status(500).send()
    }
})

router.delete('/tasks/:id',auth, async (req,res) => {
    try {
        const task = await Task.findOneAndDelete({_id : req.params.id , owner: req.user._id})

        if(!task){
            return res.status(500).send()
        }

        res.send(task)
    } catch (error) {
        res.send(error)
    }
   
})

module.exports = router