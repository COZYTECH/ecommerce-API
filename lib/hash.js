import bcrypt from "bcrypt";

const doHash = async (value, saltValue) => {
  const hashedValue = await bcrypt.hash(value, saltValue);
  return hashedValue;
};
export default doHash;
export const doHashValidation = async (value, hashedValue) => {
  const result = await bcrypt.compare(value, hashedValue);
  return result;
};
