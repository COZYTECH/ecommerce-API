import joi from "joi";

export const registerSchema = joi.object({
  username: joi.string().alphanum().min(3).max(30).required(),
  email: joi
    .string()
    .min(5)
    .max(60)
    .required()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
  password: joi.string().required().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
  address: joi.string().min(10).max(100).required(),
  repeatPassword: joi.ref("password"),
});
export const loginSchema = joi.object({
  email: joi
    .string()
    .min(5)
    .max(60)
    .required()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
  password: joi.string().required(),
});
export const changePasswordSchema = joi.object({
  oldPassword: joi.string().required(),

  newPassword: joi.string().required(),
});

export const productSchema = joi.object({
  name: joi.string().required(),
  description: joi.string().required(),
  price: joi.number().required(),
  category: joi.string().required(),
  countInStock: joi.number().required(),
});
export const superAdminSchema = joi.object({
  username: joi.string().required(),
  email: joi
    .string()
    .min(5)
    .max(60)
    .required()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
  password: joi.string().required(),
});
// export const refreshTokenSchema = joi.object({
//   refreshToken: joi.string().required(),
// });
