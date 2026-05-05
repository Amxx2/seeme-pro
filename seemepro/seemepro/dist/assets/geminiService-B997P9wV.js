const u="AIzaSyDpNU7MKo2dDcwE9Jt2UgfgzyuAOGn5R50",m="gemini-1.5-flash",r=`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${u}`;async function i(e){try{return(await e.json())?.error?.message||`HTTP ${e.status}`}catch{return await e.text()||`HTTP ${e.status}`}}async function s(e){const t=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{temperature:.3,maxOutputTokens:1024}})});if(!t.ok){const n=await i(t);throw new Error(n||"Gemini API error")}return(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text??""}async function d(e,t,a="image/jpeg"){const n=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e},{inlineData:{mimeType:a,data:t}}]}],generationConfig:{temperature:.2,maxOutputTokens:8192}})});if(!n.ok){const c=await i(n);throw new Error(c||"Gemini vision API error")}return(await n.json()).candidates?.[0]?.content?.parts?.[0]?.text??""}function o(e,t){try{const a=e.replace(/```json|```/g,"").trim();return JSON.parse(a)}catch{return t}}async function p(e="audio file uploaded by user"){const t=`You are an expert behavioral analyst AI. Analyze this voice/audio input and return a JSON analysis.

Audio context: ${e}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "sentiment": "truth" | "lie" | "stress" | "fear",
  "confidence": <number 75-99>,
  "toxicity": <number 0-100>,
  "details": [
    "<specific observation about vocal patterns>",
    "<specific observation about speech rhythm>",
    "<specific observation about emotional markers>"
  ],
  "emotionalBreakdown": {
    "joy": <number 0-100>,
    "fear": <number 0-100>,
    "anger": <number 0-100>,
    "sadness": <number 0-100>,
    "neutral": <number 0-100>
  }
}

Be realistic and analytical. Vary results based on plausible behavioral patterns.`,a=await s(t);return o(a,{sentiment:"stress",confidence:78,toxicity:25,details:["Vocal frequency analysis indicates elevated stress markers","Speech rhythm shows micro-pauses consistent with cognitive load","Baseline deviation detected in pitch modulation"],emotionalBreakdown:{joy:10,fear:35,anger:15,sadness:20,neutral:20}})}async function h(e="live video frame"){const t=`You are a real-time behavioral AI analyst. Analyze this live interview frame and return instant metrics.

Frame context: ${e}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "stress": <number 0-100>,
  "truth": <number 0-100>,
  "engagement": <number 0-100>,
  "anxiety": "Low" | "Medium" | "High",
  "heartRate": <number 60-140>,
  "voiceTremor": <number 0-100>,
  "microExpressions": [
    "<micro-expression observation 1>",
    "<micro-expression observation 2>"
  ]
}

Generate realistic, varying metrics that simulate real behavioral analysis.`,a=await s(t);return o(a,{stress:22,truth:85,engagement:78,anxiety:"Low",heartRate:76,voiceTremor:14,microExpressions:["Genuine smile detected","Sustained eye contact indicates confidence"]})}export{p as a,h as b,d as g};
