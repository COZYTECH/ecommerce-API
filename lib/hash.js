import bcrypt from "bcrypt";

const doHash = (value, saltValue) => {
  const hashedValue = bcrypt.hash(value, saltValue);
  return hashedValue;
};
export default doHash;
export const doHashValidation = async (value, hashedValue) => {
  const result = await bcrypt.compare(value, hashedValue);
  return result;
};
