
import { i18n } from "../index.js"
export const validationMessageLocale = (headers, message) => {
  if (headers.locale == "en") i18n.setLocale("en");
  else i18n.setLocale("es");
  return i18n.__(message);
};
