import { Configuration, OpenAIApi } from "openai";
import { OPENAI_API_TYPE, OPENAI_API_HOST, OPENAI_API_VERSION, AZURE_DEPLOYMENT_ID_EMBEDDINGS } from "../app/const";

export const getOpenAIApi = (deploymentId?: string): OpenAIApi => {
    const apiKey = process.env.OPENAI_API_KEY;

    let openaiConfig;
    if (OPENAI_API_TYPE == "azure") {
        openaiConfig = new Configuration({
            basePath: OPENAI_API_HOST + "/openai" + (deploymentId ? `/deployments/${deploymentId}` : ""),
            baseOptions: {
                headers: { 'api-key': apiKey },
                params: {
                    'api-version': OPENAI_API_VERSION
                }
            }
        });
    } else {
        openaiConfig = new Configuration({
            apiKey
        });
    }
    return new OpenAIApi(openaiConfig);
}

export const getOpenAIApiEmbeddings = (): OpenAIApi => {
    return getOpenAIApi(AZURE_DEPLOYMENT_ID_EMBEDDINGS)
}