
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model")



async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized, token missing"
        });
    }


    const isBlacklisted = await tokenBlackListModel.findOne({ token})

    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access,Token is invalid"
        })
    }

    try {
      //decoded kau under user ki id milega jo token generate karte waqt set kiya tha or 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //decoded se user ki id milne ke baad database me us user ko find karenge taki request ke sath user ki details bhi attach kar sake aur aage ke controllers me use kar sake. Agar user nahi milta hai to unauthorized response bhejenge.
        const user = await userModel.findById(decoded.userID);

        req.user = user; //request object me user ki details attach kar di hai taki aage ke controllers me use kar sake. Isse hume har controller me baar baar user ko database se fetch karne ki zarurat nahi padegi, hum directly req.user se user ki details access kar sakte hai.

        return next(); //agar token valid hai aur user mil gaya hai to next middleware ya controller ko call karenge taki request aage process ho sake.
        
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized, invalid token"
        });
    }       
}

async function authSystemUserMiddleware(req, res, next) {

     const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

     if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized, token missing"
        });
    }

      const isBlacklisted = await tokenBlackListModel.findOne({ token})

    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access,Token is invalid"
        })
    }


    try {
        //decoded kau under user ki id milega jo token generate karte waqt set kiya tha or
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userID).select("+systemUser"); //systemUser field ko select kar rahe hai taki pata chal sake ki user system user hai ya nahi. Isse hume apne API endpoints me system users ke liye special access control implement karne me madad milegi, jisse hum sensitive operations ko sirf system users tak limited rakh sakte hai.

        if (!user) {
       return res.status(401).json({ success: false, message: "User not found" });
        }

    
        console.log("systemUser value:", user.systemUser);


        if (!user.systemUser) {
            return res.status(403).json({
                success: false,
                message: "Forbidden, access denied for non-system users"
            });
        }
       


        req.user = user; //request object me user ki details attach kar di hai taki aage ke controllers me use kar sake. Isse hume har controller me baar baar user ko database se fetch karne ki zarurat nahi padegi, hum directly req.user se user ki details access kar sakte hai.
        return next(); //agar token valid hai, user mil gaya hai aur wo system user hai to next middleware ya controller ko call karenge taki request aage process ho sake.
}
 catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized, invalid token"
        });
    }
}


module.exports ={ authMiddleware, authSystemUserMiddleware };