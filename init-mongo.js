db.createCollection("llmPriceRate");
parseAndUpdateApiRates();

function parseAndUpdateApiRates() {
    // modelId from /types/openai OpenAIModelID
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
            db.llmPriceRate.updateOne(
                { modelId },
                {
                    $set: {
                        modelId,
                        ...(promptPricing ? { promptPriceUSDPer1000: promptPricing } : {}),
                        ...(completionPricing ? { completionPriceUSDPer1000: completionPricing } : {}),
                    }
                },
                { upsert: true }
            )
        })
}