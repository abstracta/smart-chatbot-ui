db.createCollection("llmConfig");
parseAndUpdateApiRates();

function parseAndUpdateApiRates() {
    // modelId from /types/llm LlmID
    Object.entries(process.env)
        .filter(([key, value]) => key.startsWith("MODEL_PRICING_1000_"))
        .forEach(([key, value]) => {
            let modelId, promptPricing, completionPricing;
            if (key.startsWith("MODEL_PRICING_1000_PROMPT_")) {
                modelId = key.replace("MODEL_PRICING_1000_PROMPT_", "");
                promptPricing = parseFloat(value);
            } else if (key.startsWith("MODEL_PRICING_1000_COMPLETION_")) {
                modelId = key.replace("MODEL_PRICING_1000_COMPLETION_", "");
                completionPricing = parseFloat(value);
            }
            console.log("Setting " + (promptPricing ? "prompt" : "completion") + " price rate for model " + modelId +
                " to " + (promptPricing || completionPricing));
            db.llmConfig.updateOne(
                { _id: modelId },
                {
                    $set: {
                        ...(promptPricing ? { promptPriceUSDPer1000: promptPricing } : {}),
                        ...(completionPricing ? { completionPriceUSDPer1000: completionPricing } : {}),
                    }
                },
                { upsert: true }
            )
        })
    Object.entries(process.env)
        .filter(([key, value]) => key.startsWith("MODEL_USAGE_LIMIT_USD_MONTHLY_"))
        .forEach(([key, value]) => {
            modelId = key.replace("MODEL_USAGE_LIMIT_USD_MONTHLY_", "");
            monthlyUsageLimitUSD = parseFloat(value);

            console.log("Setting monthly usage limit USD for model " + modelId +
                " to " + monthlyUsageLimitUSD);
            db.llmConfig.updateOne(
                { _id: modelId },
                {
                    $set: {
                        monthlyUsageLimitUSD
                    }
                },
                { upsert: true }
            )
        })
}