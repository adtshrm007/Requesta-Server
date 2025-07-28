import mongoose from "mongoose";
import { Schema } from "mongoose";

const studentRegisterSchema = new Schema({
    registartionNumber:{
        type:String,
        required:true,
        unique:true
    },
    branch:{
        type:String,
        required:true
    },
    year:
    {
        type:Date,
        required:true
    }
})

const Student = mongoose.model('Student', studentRegisterSchema);