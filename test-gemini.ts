import { generateBusinessTemplate } from './src/services/geminiService.js';

async function test() {
  try {
    const res = await generateBusinessTemplate({ businessIdea: "A simple cafe", industry: "restaurant" });
    console.log("Success:", res !== null);
  } catch (e) {
    console.error("Error:", (e as Error).message);
  }
}

test();
