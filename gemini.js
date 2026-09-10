/**
 * gemini.js - AI Formatting with Google Gemini
 * Uses the complete Gosheet parser prompt from the original app
 */

// ============================================
// COMPLETE GEMINI SYSTEM PROMPT
// (Extracted from the original app - formet.txt)
// ============================================

const GEMINI_SYSTEM_PROMPT = `You are a smart, fluent, human-like Gosheet parser and response assistant.

Your job is to read messy text copied from WhatsApp, Telegram, SMS, Notes, or chat and automatically understand all Gosheet number formats. Also handle short, incomplete, or mixed-language (Hindi, Hinglish, Bengali) input when the intent is clear.

General behaviour:
- Understand intent first; if the meaning is obvious, do not ask unnecessary questions.
- Give direct answers; keep replies short unless the user asks for detail.
- Do not sound robotic; think clearly even if the text is messy or incomplete.
- If the user only wants a plain sum of listed numbers (no Gosheet blocks), you may answer with a simple line like: 99 + 11 + 50 + ... + 10 = 798

STEP 1: CLEAN THE INPUT

Before processing:
- Remove dates/times like:
  [16/04, 6:43 pm]
  16/04/2026, 18:43
- Remove sender names like:
  Rahul:
  Best Developer:
  Admin:
  John -
  +919999999999:
- Remove words/lines like:
  Forwarded
  Message deleted
  Shri Ganesh
  You
  Unknown
- Remove WhatsApp/Telegram-style metadata: names before ":" "-" "|", phone +91 lines, bracket timestamps, same-line date/time prefixes.
- Remove duplicate lines automatically
- Ignore blank lines
- If a line contains both text and numbers, remove everything before the first actual number

STEP 2: SPECIAL BOX MAPPING

4 repeated digits to Box:
1111 = 101
2222 = 102
3333 = 103
4444 = 104
5555 = 105
6666 = 106
7777 = 107
8888 = 108
9999 = 109
0000 = 110

3 repeated digits to Box:
111 = 111
222 = 112
333 = 113
444 = 114
555 = 115
666 = 116
777 = 117
888 = 118
999 = 119
000 = 120

STEP 3: SUPPORTED SEPARATORS

Treat all of these as valid separators between box numbers:

. , / - * _ | space

Examples:
41-42-43
41/42/43
41,42,43
41 42 43
41*42*43
41_42_43

all mean: 41,42,43

STEP 4: DETECT THE VALUE

The amount/value may appear in any of these forms:

=50
==50
===50
====(50)
(50)
Rs.50
rs,150
RS,200
//80
/120
...170

All of the above mean the value for the previous box numbers.

Examples:
55,56,57(70)
= 3 box x 70

26,42,92==30
= 3 box x 30

99.58.52.85.25.Rs.50
= 5 box x 50

01/19/91/37/73/55/.//80
= 6 box x 80

STEP 5: FORMAT RULES

Format Type A:
01=10
02=10
Meaning:
1 box x 10 each

Format Type B:
41-42-43=50
Meaning:
3 box x 50

Format Type C:
55,56,57(70)
58,59,60(70)
Meaning:
3 box x 70 each block

Format Type D:
71*90
72*90
Meaning:
1 box x 90

Format Type E:
91*92*93(110)
94*95*96(110)
Meaning:
3 box x 110

Format Type F:
86/87/88/120
101/102/103/120
Meaning:
3 box x 120

Format Type G:
111_112=130
113_114=130
Meaning:
2 box x 130

Format Type H:
01=140 | 02=140 | 03=140
Meaning:
each box has separate value

Format Type I:
06(150)07(150)08(150)
Meaning:
1 box x 150 for each

Format Type J:
11..12..13..111..112..113(160)
Meaning:
6 box x 160

Format Type K:
16.17.18.101.102.103....170
Meaning:
all listed boxes x 170

Format Type L:
21 22 23 101 102 103 104 105 (180)
Meaning:
8 box x 180

Format Type M:
26=190. 27=190. 106=190
Meaning:
each separate box x 190

Format Type N:
31=200/32=200/111=200
Meaning:
each separate box x 200

Format Type O:
36/210
37/210
Meaning:
1 box x 210 each

Format Type P:
41/42/43(220)
101/102/103(220)
Meaning:
3 box x 220

Format Type Q:
47(230)48/49/(240)111/112/(250)
Meaning:
1 box x 230
2 box x 240
2 box x 250

Format Type R:
52*53*54*101*102*103*104*105*106*107*108*109*110=260
Meaning:
13 box x 260

Format Type S:
57.58.59.111.112.113.114.115.116.117.118.119.120=270
Meaning:
13 box x 270

Format Type T:
62/280 63/280 101/280 102/280
Meaning:
each box x 280

Format Type U:
67.68.69.111.112.113.114.115.116.117.118.119.120(290)
Meaning:
13 box x 290

Format Type V:
99.58.52.85.25.Rs.50
49.94.44.18.19.81.91.Rs.20
Meaning:
all previous boxes x given Rs value

Format Type W:
53/35/29/92/18/81/19/91====(50)ds
53/35/29/92/18/81/19/91=(50)
Meaning:
8 box x 50

Format Type X:
26,42,92==30
97,47,62==15
Meaning:
all listed boxes x given value

Format Type Y:
18*63*36*79*(20)
17*67*07*59*45*54*46*55*(5)
Meaning:
all listed boxes x bracket value

Format Type Z:
01/19/91/37/73/55/.//80
01/19/91/37/73/55/,//80
Meaning:
all listed boxes x 80

Format Type AA:
69,96,67,76,rs,150
69,96,67,76,RS,150
Meaning:
4 box x 150

STEP 6: CALCULATE

For every unique block:
- Extract all box numbers
- Find the amount
- Count total boxes
- Multiply:
  total boxes x amount

Example:
23/32/25/52/36
63/69/96/56/65=160rs

= 10 box x 160 = 1600

26/62/35/53/67/76
39/93/59/95=105rs

= 10 box x 105 = 1050

STEP 7: RESPONSE FORMAT

Always respond exactly like this:

Cleaned Content:
<only cleaned unique lines>

Calculation:
<line wise result>

Example:
55,56,57(70)
= 3 box x 70 = 210

41-42-43=50
= 3 box x 50 = 150

23/32/25/52/36/63/69/96/56/65=160
= 10 box x 160 = 1600

Block Total:
<total for each block if needed>

Final Total:
<sum of all unique block totals>

Never ask unnecessary questions if the format is understandable.

MULTI_TEXT_BUTTON_TASK (this request only):
- Ignore the STEP 7 report style here. Do NOT print those headings.
- Output ONLY plain text the user can paste into Multi text and tap Enter: valid Gosheet multi-text lines, no markdown fences, no commentary.
- If input is messy (WhatsApp, mixed separators, words): convert to our format. Prefer one comma-separated line of box=value when many boxes apply, e.g.
  01=10,02=10,03=10,04=10,05=10,06=10,07=10,08=10,09=10
  Use commas between pairs; box id 1-4 digits as per rules (01-99, 100-120, repeats 1111->101 etc.).
- If input is ALREADY almost our format: only fix minor mistakes - wrong symbol (. vs ,), extra spaces, missing or doubled =, stray brackets, typos - keep the same numbers and intent.
- Follow training examples when they show a specific line shape; otherwise use the preferred comma-separated box=value style above.

Pasted text:`;

// ============================================
// SAVE GEMINI API KEY
// ============================================

function saveGeminiKey() {
    const keyInput = document.getElementById('geminiKey');
    const statusEl = document.getElementById('keyStatus');
    
    if (!keyInput || !statusEl) return;
    
    const key = keyInput.value.trim();
    
    if (!key) {
        if (typeof showToast === 'function') {
            showToast('Please enter a valid API key', 'error');
        } else {
            alert('Please enter a valid API key');
        }
        return;
    }
    
    // Basic validation - Gemini keys start with "AIza"
    if (!key.startsWith('AIza')) {
        if (typeof showToast === 'function') {
            showToast('Invalid key format (should start with AIza)', 'error');
        } else {
            alert('Invalid key format. Gemini keys start with "AIza"');
        }
        return;
    }
    
    localStorage.setItem('gemini_api_key', key);
    statusEl.textContent = '✅ Key saved!';
    statusEl.style.color = '#28a745';
    
    if (typeof showToast === 'function') {
        showToast('🔑 Gemini API key saved!', 'success');
    }
    
    setTimeout(() => {
        statusEl.textContent = '';
    }, 3000);
}

// ============================================
// LOAD GEMINI API KEY ON PAGE LOAD
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const keyInput = document.getElementById('geminiKey');
    const statusEl = document.getElementById('keyStatus');
    
    if (savedKey && keyInput) {
        keyInput.value = savedKey;
        if (statusEl) {
            statusEl.textContent = '🔑 Key loaded';
            statusEl.style.color = '#28a745';
        }
    }
});

// ============================================
// CALL GEMINI API
// ============================================

async function callGemini(inputText) {
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
        throw new Error('Please save your Gemini API key first');
    }
    
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: GEMINI_SYSTEM_PROMPT + '\n' + inputText
            }]
        }],
        generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.95,
            maxOutputTokens: 8192
        }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API error: ${response.status}`;
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
            return parts[0].text;
        }
    }
    
    throw new Error('Invalid response from Gemini API');
}

// ============================================
// CLEAN AI OUTPUT
// Removes markdown, explanatory text, extra whitespace
// ============================================

function cleanAIOutput(text) {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Remove markdown code fences
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
    });
    
    // Remove any remaining backticks
    cleaned = cleaned.replace(/`/g, '');
    
    // Split into lines
    const lines = cleaned.split('\n');
    const validLines = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Skip common AI response headers
        const skipPatterns = [
            /^cleaned content:?$/i,
            /^calculation:?$/i,
            /^block total:?$/i,
            /^final total:?$/i,
            /^here is/i,
            /^here's/i,
            /^the formatted/i,
            /^formatted output/i,
            /^output:?$/i,
            /^result:?$/i,
            /^summary:?$/i,
            /^note:/i,
            /^explanation:/i
        ];
        
        let shouldSkip = false;
        for (const pattern of skipPatterns) {
            if (pattern.test(line)) {
                shouldSkip = true;
                break;
            }
        }
        if (shouldSkip) continue;
        
        // Skip lines with markdown headers (##, ###)
        if (/^#{1,6}\s/.test(line)) continue;
        
        // Skip lines that are only dashes/equals (separators)
        if (/^[-=]{3,}$/.test(line)) continue;
        
        // Keep lines that look like valid data
        // Valid: contains = OR pure numbers OR box patterns
        const hasEquals = line.includes('=');
        const isPureNumber = /^\d+$/.test(line);
        const isDataPattern = /^[\d\s,.\-*_()\/|'`]+$/.test(line);
        const hasNumbers = /\d/.test(line);
        
        if (hasEquals || isPureNumber || (isDataPattern && hasNumbers)) {
            validLines.push(line);
        }
    }
    
    return validLines.join('\n').trim();
}

// ============================================
// MAGIC FORMAT BUTTON
// Main function called by the Magic button
// ============================================

async function magicFormat() {
    const inputEl = document.getElementById('inputText');
    const magicBtn = document.querySelector('.btn-magic-inside');
    
    if (!inputEl) return;
    
    const input = inputEl.value.trim();
    
    if (!input) {
        if (typeof showToast === 'function') {
            showToast('Please paste some data first', 'error');
        }
        return;
    }
    
    // Check for API key
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        if (typeof showToast === 'function') {
            showToast('Please save your Gemini API key first!', 'error');
        }
        return;
    }
    
    // Set loading state
    if (magicBtn) {
        magicBtn.disabled = true;
        magicBtn.classList.add('loading');
        magicBtn.textContent = '🪄 ...';
    }
    
    if (typeof showToast === 'function') {
        showToast('🪄 AI is formatting...', 'info');
    }
    
    try {
        const rawResponse = await callGemini(input);
        const cleaned = cleanAIOutput(rawResponse);
        
        if (!cleaned) {
            throw new Error('AI returned empty result');
        }
        
        // Put the formatted result into the textarea
        inputEl.value = cleaned;
        
        if (typeof showToast === 'function') {
            showToast('✨ AI formatting complete!', 'success');
        }
        
    } catch (error) {
        console.error('Magic format error:', error);
        
        let errorMsg = error.message;
        
        // Friendlier error messages
        if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
            errorMsg = 'Invalid API key. Please check and re-save your key.';
        } else if (errorMsg.includes('quota') || errorMsg.includes('QUOTA')) {
            errorMsg = 'API quota exceeded. Try again later.';
        } else if (errorMsg.includes('Failed to fetch')) {
            errorMsg = 'Network error. Check your internet connection.';
        }
        
        if (typeof showToast === 'function') {
            showToast('❌ ' + errorMsg, 'error');
        }
    } finally {
        // Reset button state
        if (magicBtn) {
            magicBtn.disabled = false;
            magicBtn.classList.remove('loading');
            magicBtn.textContent = '🪄 Magic';
        }
    }
}

// ============================================
// EXPORT FOR BROWSER
// ============================================

if (typeof window !== 'undefined') {
    window.saveGeminiKey = saveGeminiKey;
    window.callGemini = callGemini;
    window.cleanAIOutput = cleanAIOutput;
    window.magicFormat = magicFormat;
}
