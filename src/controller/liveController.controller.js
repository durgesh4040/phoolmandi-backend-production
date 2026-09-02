// import liveModel from "../model/liveModel.js";
// import { uploadImage } from '../configuration/cloudinary.js';
// export const liveflowerSave = async (req, res) => {
//   try {
//     const { name, category, unit, price } = req.body;
//     if (!req.file) {
//       return res.status(400).json({ message: "Image file is required" });
//     }
//     const imagePath = req.file.path;
//     const result = await uploadImage(imagePath);
//     const live = await liveModel.create({
//       name,
//       category,
//       unit,
//       price,
//       imageUrl: result,
//       date: Date.now(),
//     });

//     res.status(201).json({
//       message: "Live flower price is updated",
//       data: live,
//     });
//   } catch (error) {
//     console.error("Error saving live flower:", error);
//     res.status(500).json({
//       message: "Server error while saving live flower",
//       error: error.message,
//     });
//   }
// };

// export const liveFlowerGet=async (req,res)=>{
//  let page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//       let search = (req.query.search || "").trim();
//         search = search.replace(/^['"]+|['"]+$/g, "");
//   try{
//        const query = search ? { name: { $regex: search, $options: "i" } } : {};
//        const total = await liveModel.countDocuments(query);
//        const totalPages=Math.ceil(total/limit); 
//       if(page>totalPages && totalPages>0) page=totalPages;
//         const skip = (page - 1) * limit;
//       const live = await liveModel.find(query).skip(skip).limit(limit);
//         res.json({
//             message: "Get all live Price of flower",
//             page,
//             totalPages:totalPages,
//             totalItem: total,
//             live: live
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Server error" });
//     }
// }