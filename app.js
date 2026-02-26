// app.js

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const reportsContainer = document.getElementById('reportsContainer');

const configBtn = document.getElementById('configBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const apiKeyInput = document.getElementById('apiKeyInput');

// Conversation History
let conversationHistory = [
    {
        role: "system",
        content: `You are a Smart Civic AI Assistant designed for Indian citizens.
Your role is to behave like a real municipal support officer who:
• Speaks naturally in Hindi, English, Marathi, or Hinglish
• Understands citizen problems emotionally
• Detects urgency and civic category automatically
• Makes users feel heard and supported

Your job is NOT just to collect complaints. Your job is to:
1. Understand the real issue
2. Identify complaint category
3. Detect urgency level
4. Ask only necessary follow-up questions
5. Speak politely and supportively
6. Adapt to user's language automatically

Civic Categories include: Water Supply, Garbage / Waste, Road Damage, Drainage / Sewage, Electricity, Street Light, Public Safety, Others.

Urgency Detection Rules:
- Words like "leak", "flood", "danger", "shock", "fire" → HIGH priority
- "Not working", "broken", "dirty" → MEDIUM
- "Suggestion", "request" → LOW

Conversation Rules:
- If user sounds angry: Respond with empathy
- If user mixes language: Reply in same tone
- Always confirm: Area and Problem type.

If all details (Problem and Area) are collected, you MUST generate the JSON report securely wrapped between triple backticks like this:
\`\`\`json
{
  "Complaint Summary": "Brief description",
  "Department": "Relevant Dept",
  "Priority": "HIGH/MEDIUM/LOW",
  "Area": "Area name",
  "Citizen Name": "Name or N/A"
}
\`\`\`
Before the JSON, provide a polite closing message.`
    }
];

// Load API Key safely
let GEMINI_API_KEY = localStorage.getItem('geminiApiKey') || '';
if (GEMINI_API_KEY) {
    apiKeyInput.value = GEMINI_API_KEY;
}

// Modal Listeners
configBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
saveSettingsBtn.addEventListener('click', () => {
    GEMINI_API_KEY = apiKeyInput.value.trim();
    localStorage.setItem('geminiApiKey', GEMINI_API_KEY);
    settingsModal.classList.add('hidden');
});

// Auto-expand textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';

    // reset if empty
    if (this.value === '') {
        this.style.height = 'auto';
    }
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

sendBtn.addEventListener('click', handleSend);

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';

    conversationHistory.push({ role: "user", content: text });

    const typingId = showTypingIndicator();
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        let aiResponse = "";

        if (GEMINI_API_KEY) {
            aiResponse = await fetchGeminiResponse();
        } else {
            // Fallback: Smart Simulation Mode
            aiResponse = await simulateSmartResponse(text);
        }

        removeTypingIndicator(typingId);

        // Parse for JSON report
        // Allow optional "json" identifier and varying whitespace
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        let displayText = aiResponse;

        if (jsonMatch) {
            displayText = aiResponse.replace(jsonMatch[0], '').trim();
            try {
                // Find the first `{` and last `}` to ensure we only parse the JSON object
                const jsonString = jsonMatch[1];
                const startIndex = jsonString.indexOf('{');
                const endIndex = jsonString.lastIndexOf('}');

                if (startIndex !== -1 && endIndex !== -1) {
                    const cleanJson = jsonString.substring(startIndex, endIndex + 1);
                    const reportData = JSON.parse(cleanJson);
                    addReportCard(reportData);
                }
            } catch (e) {
                console.error("Failed to parse report JSON", e, "Raw string:", jsonMatch[1]);
            }
        }

        appendMessage('bot', displayText || "Kripya apni samasya batayein."); // Fallback if text is empty after removing JSON
        conversationHistory.push({ role: "model", content: aiResponse });

    } catch (error) {
        removeTypingIndicator(typingId);
        appendMessage('bot', `Kshama karein, ek technical error aayi hai. Kripya apna internet connection check karein ya baad mein try karein. (Error: ${error.message})`);
    }
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);

    const bubble = document.createElement('div');
    bubble.classList.add('msg-bubble');

    if (sender === 'bot') {
        bubble.innerHTML = marked.parse(text); // Use marked to render Markdown safely
    } else {
        bubble.textContent = text;
    }

    msgDiv.appendChild(bubble);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot');
    msgDiv.id = id;

    const bubble = document.createElement('div');
    bubble.classList.add('msg-bubble', 'typing-indicator');

    bubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    msgDiv.appendChild(bubble);
    chatBox.appendChild(msgDiv);
    return id;
}

function removeTypingIndicator(id) {
    const node = document.getElementById(id);
    if (node) {
        node.remove();
    }
}

// ----------------------------------------------------
// Smart API Calls
// ----------------------------------------------------

async function fetchGeminiResponse() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Convert generic history to Gemini format
    const contents = conversationHistory.map(msg => {
        if (msg.role === 'system') {
            return { role: 'user', parts: [{ text: "SYSTEM INSTRUCTION (Adopt this persona): " + msg.content }] };
        }
        return {
            role: msg.role === 'bot' || msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        };
    });

    const body = {
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("API request failed. Is your key valid?");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// ----------------------------------------------------
// Smart Built-in Simulation Fallback
// ----------------------------------------------------
let demoState = { hasArea: false, hasProblem: false, area: "", problem: "", priority: "LOW", dept: "Others" };

async function simulateSmartResponse(text) {
    return new Promise(resolve => {
        setTimeout(() => {
            let response = "";
            let t = text.toLowerCase();

            // Detect Area
            if (t.includes("andheri") || t.includes("bandra") || t.includes("road") || t.includes("area")) {
                demoState.hasArea = true;
                demoState.area = "Citizen Specific Area";
            }

            // High Priority Detect
            if (t.includes("leak") || t.includes("flood") || t.includes("phoot") || t.includes("danger") || t.includes("fire")) {
                demoState.priority = "HIGH";
                demoState.hasProblem = true;
                if (t.includes("paani") || t.includes("water") || t.includes("leak") || t.includes("phoot")) demoState.dept = "Water Supply";
            }
            // Med Priority Detect
            else if (t.includes("broken") || t.includes("khaarab") || t.includes("dirty") || t.includes("light") || t.includes("kachra")) {
                demoState.priority = "MEDIUM";
                demoState.hasProblem = true;
                if (t.includes("light") || t.includes("bijli")) demoState.dept = "Electricity";
                else if (t.includes("kachra") || t.includes("garbage")) demoState.dept = "Garbage / Waste";
            }

            if (demoState.hasProblem && !demoState.hasArea) {
                response = "Yeh urgent " + demoState.dept + " issue lag raha hai. Kripya apna exact area batayein taaki team jaldi pahonch sake.";
            } else if (!demoState.hasProblem) {
                response = "Main samajh sakta hoon. Kya aap detail mein bata sakte hain ki exact problem kya hai?";
            } else if (demoState.hasProblem && demoState.hasArea) {
                response = "Aapki jankari ke liye dhanyawad! Maine complaint note kar li hai aur jaldi hi sambhandhit vibhag (Department) ko bhej di jayegi.\n\n```json\n" + JSON.stringify({
                    "Complaint Summary": "Reported issue regarding " + demoState.dept,
                    "Department": demoState.dept,
                    "Priority": demoState.priority,
                    "Area": "Mentioned location",
                    "Citizen Name": "Not provided"
                }, null, 2) + "\n```";

                // reset for next
                demoState = { hasArea: false, hasProblem: false, area: "", problem: "", priority: "LOW", dept: "Others" };
            }

            resolve(response);
        }, 1500);
    });
}

function addReportCard(data) {
    const container = document.getElementById('reportsContainer');
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const priorityClass = data.Priority === 'HIGH' ? 'priority-high' : data.Priority === 'MEDIUM' ? 'priority-medium' : 'priority-low';

    const card = document.createElement('div');
    card.classList.add('report-card');

    // Using strict string concatenation/template string fixes
    let htmlContent = `
        <h3>${data["Complaint Summary"]}</h3>
        <div class="report-detail">
            <span>Department:</span>
            <span>${data.Department}</span>
        </div>
        <div class="report-detail">
            <span>Priority:</span>
            <span class="${priorityClass}">${data.Priority}</span>
        </div>
        <div class="report-detail">
            <span>Area:</span>
            <span>${data.Area}</span>
        </div>
    `;

    if (data["Citizen Name"] && data["Citizen Name"] !== 'N/A' && data["Citizen Name"] !== 'Not provided') {
        htmlContent += `
        <div class="report-detail">
            <span>Name:</span>
            <span>${data["Citizen Name"]}</span>
        </div>`;
    }

    card.innerHTML = htmlContent;
    container.prepend(card);
}
