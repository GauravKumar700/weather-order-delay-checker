import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { fetchAllWeather, isDelayCondition } from "./weather.js";
import { apologyMessage } from "./apology.js";

const ORDERS_FILE = "./orders.json";

async function main() {
    if (!process.env.OPENWEATHER_API_KEY) {
        console.error("Missing OPENWEATHER_API_KEY. Add it to your .env file.");
        process.exit(1);
    }

    const raw = await readFile(ORDERS_FILE, "utf-8");
    const orders = JSON.parse(raw);

    console.log(`Fetching weather for ${orders.length} cities...\n`);

    const results = await fetchAllWeather(orders);

    const updatedOrders = [];

    for (const result of results) {
        const { success, condition, error, ...order } = result;

        if (!success) {
            console.log(`Order ${order.order_id} (${order.city}): skipped — ${error}`);
            updatedOrders.push(order);
            continue;
        }

        if (isDelayCondition(condition)) {
            order.status = "Delayed";
            const message = await apologyMessage(order.customer, order.city, condition);
            order.apologyMessage = message;
            console.log(`Order ${order.order_id} (${order.city}): DELAYED — ${condition}`);
            console.log(`  -> ${message}`);
        } else {
            console.log(`Order ${order.order_id} (${order.city}): OK — ${condition}`);
        }

        updatedOrders.push(order);
    }

    await writeFile(ORDERS_FILE, JSON.stringify(updatedOrders, null, 2));
    console.log(`\nDone. ${ORDERS_FILE} updated.`);
}

main();