async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.log("No API Key found");
    return;
  }
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  console.log(JSON.stringify(data.models?.map((m: any) => m.name), null, 2));
}
listModels();
