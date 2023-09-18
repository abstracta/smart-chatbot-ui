import HomeContext from "@/pages/api/home/home.context";
import { ErrorResponseCode } from "@/types/error";
import { useContext } from "react";
import { useTranslation } from "react-i18next";

interface TranslationContext {
  supportEmail?: string | null
}

const useApiError = () => {
  const {
    state: {
      supportEmail
    },
  } = useContext(HomeContext);
  const { t } = useTranslation("error");
  const translationContext: TranslationContext = { supportEmail };
  const defaultMessage = t("errorDefault", translationContext) || "Error";

  const resolveResponseMessage = async (error: any): Promise<string> => {
    if (error instanceof Response) {
      const json = await error.json();
      if (json.error?.code) {
        if (json.error.code == ErrorResponseCode.ERROR_DEFAULT || !supportEmail) {
          return json.error?.message || defaultMessage;
        }
        return t(json.error.code.toString(), translationContext) || defaultMessage;
      } else {
        return t(json.error || json.message) || defaultMessage
      }
    } else {
      return typeof error == "string" ? t(error).toString() : defaultMessage;
    }
  }

  return {
    resolveResponseMessage,
  };
}

export default useApiError;