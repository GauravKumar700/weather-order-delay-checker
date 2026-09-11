import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function fallbackMessage(firstName, city, condition) {
    let reason;
    switch (condition) {
        case "Rain":
            reason = "heavy rain";
            break;
        case "Snow":
            reason = "heavy snow"
            break;
        default:
            reason = "extreme weather conditions"
    }
    return `Hi ${firstName}, your order to ${city} is delayed due to ${reason}. We appreciate your patience!`;
}

// Generates a personalized delay apology message using Groq's chat
export async function apologyMessage(customer, city, condition) {
    const firstName = customer.split(" ")[0];

    if (!process.env.GROQ_API_KEY) {
        return fallbackMessage(firstName, city, condition);
    }

    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You write short, warm, one-sentence delivery delay apology messages for an e-commerce company. Return ONLY the message itself — no preamble, no quotes, no extra commentary.",
                },
                {
                    role: "user",
                    content:
                        `Write a one-sentence delay apology for customer ${firstName}, whose order to ${city} is delayed because of ${condition.toLowerCase()} weather. Match this exact style and length: "Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!"`,
                },
            ],
            model: "openai/gpt-oss-20b",
        });

        const message = response?.choices?.[0]?.message?.content?.trim();
        return message || fallbackMessage(firstName, city, condition);
    } catch (err) {
        console.error(`[AI WARNING] Falling back to template message for ${customer}: ${err.message}`);
        return fallbackMessage(firstName, city, condition);
    }
}
