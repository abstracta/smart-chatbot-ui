import { LlmUsageMode, TokenUsageCount, NewUserLlmUsage } from "@/types/llmUsage";
import { OpenAIModelID } from "@/types/openai";
import { UserDb, LlmsDb, getDb } from "./storage";
import { DEFAULT_USER_LIMIT_USD_MONTHLY } from "../app/const";

export async function verifyUserLlmUsage(userId: string, modelId: OpenAIModelID) {
    const remainingBudget = await getMonthlyUsedBudgetPercent(userId);
    if (remainingBudget === 100) throw new Error("Uh-oh! You've reached the monthly API limit. Please reach out to the admin team for assistance.");
}

export async function getMonthlyUsedBudgetPercent(userId: string): Promise<number> {
    const userDb = await UserDb.fromUserHash(userId);
    const currentUser = await userDb.getCurrenUser();
    const userBudgetLimit = currentUser.monthlyUSDConsumptionLimit ?? DEFAULT_USER_LIMIT_USD_MONTHLY;
    if (userBudgetLimit < 0) return 0;
    const currentDate = new Date();
    let startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    let nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const usedBudgetUSD = await userDb.getLlmUsageUSD(startOfMonth, nextMonth);
    return Math.min(100, usedBudgetUSD / userBudgetLimit * 100);
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