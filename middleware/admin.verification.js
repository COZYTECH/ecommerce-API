// const authorizeRoles = (req, res, next) => {
//   if (req.user && req.user.role === "admin") {
//     next();
//   } else {
//     res.status(403);
//     throw new Error("Admin access only");
//   }

//still the same thing

//   if (!req.user) {
//     res.status(401);
//     return next(new Error("Not authorized, no user token"));
//   }

//   if (req.user.role !== "admin") {
//     res.status(403);
//     return next(new Error("Admin access only"));
//   }

//   next();
// };
// export default authorizeRoles;

//Reusable role-based authorization middleware
// const authorizeRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !allowedRoles.includes(req.user.role)) {
//       return res
//         .status(403)
//         .json({ message: "Access denied: insufficient permissions" });
//     }
//     next();
//   };
// };

// export default authorizeRoles;
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }
  };
};
export default authorizeRoles;
