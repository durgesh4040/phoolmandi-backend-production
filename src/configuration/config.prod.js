import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const productImageFilePath = path.resolve(__dirname, '../../public/productImage');
export const productImageUploadPath = 'public/productImage';
export const categoryImageFilePath = path.resolve(__dirname, '../../public/categoryImage');
export const categoryImageUploadPath = 'public/categoryImage';

export default {
  productImageFilePath,
  productImageUploadPath,
  categoryImageFilePath,
  categoryImageUploadPath,
};