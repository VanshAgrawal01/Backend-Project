const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email : {
    type : String,
    required : [true, "Email is required"], 
    unique : true,
    lowercase : true,
    match : [/\S+@\S+\.\S+/, "Please provide a valid email address"],
    trim : true
  },
  name : {
    type : String,
    required : [true, "Name is required"],
    trim : true
  },
  password : {
    type : String,
    required : [true, "Password is required"],
    Minlength : [6, "Password must be at least 6 characters long"],
    select : false,
  },
   systemUser : {
    type : Boolean,
    default : false,
    immutable : true , //system user ko modify nahi kar sakte hai
    select : false 
   }
},{
  timestamps : true  //user ki creation aur update time ko track karne ke liye 
});

userSchema.pre('save', async function(next) {
  
  if(!this.isModified('password')) {
    return 
  }
   

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  return             

});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;