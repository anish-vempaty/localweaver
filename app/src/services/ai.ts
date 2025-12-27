export async function generateContent(prompt: string, context: string = ""): Promise<string> {
    try {
        const systemMessage = context
            ? `You are an expert web developer helper. The user is editing a webpage. 
               Here is the current HTML/CSS content of the page:
               \`\`\`html
               ${context}
               \`\`\`
               The user wants to add or modify elements based on this request: "${prompt}".
               Return ONLY the HTML code for the new/modified elements. Do not return markdown fences or explanation. 
               If the user asks for a full page redesign, providing the full HTML is okay.`
            : `You are an expert web developer assistant. Output only raw HTML code snippet for the requested element. Do not include markdown code fence.`;

        // Attempt to connect to local llama.cpp server
        const response = await fetch('http://localhost:8081/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: prompt }
                ],
                stream: false,
            })
        });

        if (!response.ok) {
            throw new Error(`AI Server Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("AI Generation failed:", error);
        throw error;
    }
}
