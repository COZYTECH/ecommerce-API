// import { v4 as uuidv4 } from "uuid";

// export const cartKeyMiddleware = (req, res, next) => {
//   let cartId = req.cookies.cartId;

//   if (!cartId) {
//     cartId = uuidv4();
//     res.cookie("cartId", cartId, {
//       httpOnly: false,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//   }

//   req.cartKey = `cart:guest:${cartId}`;

//   next();
// };
// import { v4 as uuidv4 } from "uuid";

// export const cartKeyMiddleware = (req, res, next) => {
//   if (req.user && req.user._id) {
//     // Logged-in user use user cart
//     req.cartKey = `cart:user:${req.user._id}`;
//   } else {
//     // Guest user  generate guest cart
//     let cartId = req.cookies.cartId;
//     if (!cartId) {
//       cartId = uuidv4();
//       res.cookie("cartId", cartId, {
//         httpOnly: false,
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//       });
//     }
//     req.cartKey = `cart:guest:${cartId}`;
//   }

//   next();
// };

import crypto from "crypto";

export const cartKeyMiddleware = (req, res, next) => {
  // If authenticated  always use user cart
  if (req.user && req.user.userId) {
    req.cartKey = `cart:user:${req.user.userId}`;
    return next();
  }

  // Guest  use guest cart cookie
  let guestId = req.cookies.cartId;

  if (!guestId) {
    guestId = crypto.randomBytes(16).toString("hex");
    res.cookie("cartId", guestId, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  req.cartKey = `cart:guest:${guestId}`;
  next();
};
