import mongoose,{ Schema } from "mongoose";

const LeaveModelSchema = new Schema({
    student:{
        type:Schema.Types.ObjectId,
        required:true,

    },
    Reason:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:["pending","accepted","rejected"],
        default:"pending",
    },
    SupportingDocuments:{
        type:String,
        required:false
    }
}, { timestamps: true });



const LeaveModel=mongoose.model("Leave",LeaveModelSchema);
export default LeaveModel
