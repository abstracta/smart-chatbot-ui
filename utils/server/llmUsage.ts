import { UserLlmUsage, LlmUsageMode, TokenUsageCount, NewUserLlmUsage } from "@/types/llmUsage";
import { OpenAIModelID } from "@/types/openai";
import { UserDb, LlmsDb, getDb } from "./storage";
import { DEFAULT_USER_LIMIT_USD_MONTHLY } from "../app/const";

export async function verifyUserLlmUsage(userId: string, modelId: OpenAIModelID) {
    if (!(await checkUserUSDConsumptionMonthly(userId))) throw new Error("Uh-oh! You've reached the monthly API limit. Please reach out to the admin team for assistance.");
}

export async function checkUserUSDConsumptionMonthly(userId: string): Promise<boolean> {
    const userDb = await UserDb.fromUserHash(userId);
    const currentUser = await userDb.getCurrenUser();
    const date = new Date();
    let start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    let end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
    const modelUsage = await userDb.getLlmUsageBetweenDates(start, end);
    const totalPriceUSDUsage = modelUsage.reduce((prev, curr: UserLlmUsage) => prev + (curr.totalPriceUSD || 0), 0);

    const currentUserLimitUSD = currentUser.monthlyUSDConsumptionLimit ?? DEFAULT_USER_LIMIT_USD_MONTHLY;
    if (currentUserLimitUSD >= 0) {
        return totalPriceUSDUsage <= currentUserLimitUSD;
    }
    return true;
}

export async function saveLlmUsage(userId: string, modelId: OpenAIModelID, mode: LlmUsageMode, tokens: TokenUsageCount) {
    const userDb = await UserDb.fromUserHash(userId);
    const llmDb = new LlmsDb(await getDb());
    const modelUsage: NewUserLlmUsage = {
        date: new Date(),
        tokens: tokens,
        modelId: modelId,
        mode: mode,
    };
    const modelPriceRate1000 = await llmDb.getModelPriceRate(modelId);
    if (modelPriceRate1000) {
        modelUsage.totalPriceUSD = tokens.prompt / 1000 * modelPriceRate1000.promptPriceUSDPer1000
            + tokens.completion / 1000 * modelPriceRate1000.completionPriceUSDPer1000;
    }
    return await userDb.addLlmUsage(modelUsage)
}