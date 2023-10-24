import { LlmUsageMode, TokenUsageCount, NewUserLlmUsage } from "@/types/llmUsage";
import { UserDb, LlmsDb, getDb, UserInfoDb } from "./storage";
import { DEFAULT_USER_LIMIT_USD_MONTHLY } from "../app/const";
import { LlmID } from "@/types/llm";
import { ApiError, ErrorResponseCode } from "@/types/error";

export async function verifyUserLlmUsage(userId: string, modelId: LlmID) {
    const usedBudget = await getMonthlyUsedBudgetPercent(userId);
    if (usedBudget >= 100) throw new ApiError({
        code: ErrorResponseCode.USER_USAGE_LIMIT_REACHED,
        message: `Usage limit reached for user: ${userId}`
    });

    const modelConfig = await (new LlmsDb(await getDb())).getModelConfig(modelId);
    if (modelConfig && modelConfig?.monthlyUsageLimitUSD >= 0) {
        const monthlyUsageLimitUSD = modelConfig?.monthlyUsageLimitUSD;
        const monthlyModelUsage = await getMonthlyModelUsageUSD(modelId);
        if (monthlyUsageLimitUSD && monthlyUsageLimitUSD >= 0 && monthlyModelUsage > monthlyUsageLimitUSD)
            throw new ApiError({
                code: ErrorResponseCode.MODEL_USAGE_LIMIT_REACHED,
                message: `Usage limit reached for model: ${modelId}`
            });
    }
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

export async function getMonthlyModelUsageUSD(modelId: LlmID): Promise<number> {
    const userInfoDb = new UserInfoDb(await getDb())
    const currentDate = new Date();
    let startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    let nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const modelUsage = await userInfoDb.queryLlmUsageStatsByModel(modelId, startOfMonth, nextMonth);
    return modelUsage?.totalUSD || 0;
}

export async function saveLlmUsage(userId: string, modelId: LlmID, mode: LlmUsageMode, tokens: TokenUsageCount) {
    const userDb = await UserDb.fromUserHash(userId);
    const llmDb = new LlmsDb(await getDb());
    const modelUsage: NewUserLlmUsage = {
        date: new Date(),
        tokens: tokens,
        modelId: modelId,
        mode: mode,
    };
    const modelConfig = await llmDb.getModelConfig(modelId);
    if (modelConfig) {
        modelUsage.totalPriceUSD = tokens.prompt / 1000 * modelConfig.promptPriceUSDPer1000
            + tokens.completion / 1000 * modelConfig.completionPriceUSDPer1000;
    }
    return await userDb.addLlmUsage(modelUsage)
}