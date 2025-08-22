import mongoose,{ Schema } from "mongoose";

const NotificationModel=new Schema({
  studentID:{
    type:Schema.Types.ObjectId,
    required:true
  },
  mail_log:{
    type:String,
    required:true,
  }



},{timestamps:true})

const Notification=mongoose.Schema("Notification",NotificationModel)
export default Notification