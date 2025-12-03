# Flow Step Tracking Logs - Implementation Summary

## ✅ Logging Implementation Complete

Added comprehensive console logs at each of the 10 critical steps in the prompt → sandbox preview flow. All logs follow the format:

```
[FLOW_STEP_X] STEP X: Step Name - STATUS: Description
```

Where:
- **X** = Step number (1-10)
- **STATUS** = START | PROGRESS | COMPLETE | ERROR | WARNING
- **Description** = Clear message about what's happening

---

## 📋 Step-by-Step Log Locations

### **Step 1: User Enters Prompt → Agent Session Creation**

**Frontend:** `src/routes/chat/hooks/use-chat.ts`
- Line ~463: `[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - START`
- Line ~478: `[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - COMPLETE`
- Line ~480: `[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - ERROR`

**Backend:** `worker/api/controllers/agent/controller.ts`
- Line ~137: `[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - COMPLETE`

---

### **Step 2: Blueprint Generation → HTTP Stream**

**Frontend:** `src/routes/chat/hooks/use-chat.ts`
- Line ~510: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - START`
- Line ~521: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS`
- Line ~560: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - COMPLETE`

**Backend:** `worker/api/controllers/agent/controller.ts`
- Line ~137: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - START`
- Line ~145: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS` (chunk received)
- Line ~152: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - ERROR` (write error)

**Backend:** `worker/agents/core/simpleGeneratorAgent.ts`
- Line ~208: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS`
- Line ~235: `[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - COMPLETE`

---

### **Step 3: Blueprint Display → UI Rendering**

**Frontend:** `src/routes/chat/hooks/use-chat.ts`
- Line ~580: `[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - COMPLETE`
- Line ~586: `[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - WARNING`
- Line ~590: `[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - PROGRESS`
- Line ~604: `[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - COMPLETE`
- Line ~610: `[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - ERROR`

---

### **Step 4: WebSocket Connection**

**Frontend:** `src/routes/chat/hooks/use-chat.ts`
- Line ~625: `[FLOW_STEP_4] STEP 4: WebSocket Connection - START`
- Line ~627: `[FLOW_STEP_4] STEP 4: WebSocket Connection - ERROR` (no URL)
- Line ~632: `[FLOW_STEP_4] STEP 4: WebSocket Connection - ERROR` (no agent ID)
- Line ~331: `[FLOW_STEP_4] STEP 4: WebSocket Connection - COMPLETE`
- Line ~408: `[FLOW_STEP_4] STEP 4: WebSocket Connection - ERROR` (permanent failure)

---

### **Step 5: Code Generation → WebSocket Messages**

**Frontend:** `src/routes/chat/utils/handle-websocket-message.ts`
- Line ~523: `[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - PROGRESS`
- Line ~530: `[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - COMPLETE`

**Backend:** `worker/agents/core/websocket.ts`
- Line ~33: `[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - START`
- Line ~34: `[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - COMPLETE`
- Line ~34: `[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - ERROR`

---

### **Step 6: Sandbox Deployment → WebSocket Messages**

**Frontend:** `src/routes/chat/utils/handle-websocket-message.ts`
- Line ~583: `[FLOW_STEP_6] STEP 6: Sandbox Deployment → WebSocket Messages - START`
- Line ~588: `[FLOW_STEP_6] STEP 6: Sandbox Deployment → WebSocket Messages - COMPLETE`

**Backend:** `worker/agents/core/websocket.ts`
- Line ~61: `[FLOW_STEP_6] STEP 6: Sandbox Deployment → WebSocket Messages - START`
- Line ~63: `[FLOW_STEP_6] STEP 6: Sandbox Deployment → WebSocket Messages - COMPLETE`
- Line ~65: `[FLOW_STEP_6] STEP 6: Sandbox Deployment → WebSocket Messages - ERROR`

**Backend:** `worker/agents/services/implementations/DeploymentManager.ts`
- Line ~579: `[FLOW_STEP_6] STEP 6: Sandbox Instance Creation - START`
- Line ~586: `[FLOW_STEP_6] STEP 6: Sandbox Instance Creation - ERROR`
- Line ~590: `[FLOW_STEP_6] STEP 6: Sandbox Instance Creation - COMPLETE`

**Backend:** `worker/services/sandbox/sandboxSdkClient.ts`
- Line ~939: `[FLOW_STEP_7] STEP 7: Template Installation & Setup - START`

---

### **Step 7: Template Installation & Setup**

**Backend:** `worker/services/sandbox/sandboxSdkClient.ts`
- Line ~939: `[FLOW_STEP_7] STEP 7: Template Installation & Setup - START`
- Line ~945: `[FLOW_STEP_7] STEP 7: Template Installation & Setup - COMPLETE`
- Line ~946: `[FLOW_STEP_7] STEP 7: Template Installation & Setup - ERROR`
- Line ~952: `[FLOW_STEP_7] STEP 7: Template Installation & Setup - PROGRESS`
- Line ~953: `[FLOW_STEP_7] STEP 7: Template Installation & Setup - COMPLETE`

---

### **Step 8: Sandbox Preview URL → GET Request**

**Frontend:** `src/routes/chat/components/preview-iframe.tsx`
- Line ~183: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - START`
- Line ~187: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - COMPLETE`
- Line ~211: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - PROGRESS`
- Line ~214: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - PROGRESS` (auto-redeploy)
- Line ~164: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - ERROR`

**Frontend:** `src/routes/chat/utils/handle-websocket-message.ts`
- Line ~591: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - COMPLETE`

**Backend:** `worker/services/sandbox/sandboxSdkClient.ts`
- Line ~956: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - START`

**Backend:** `worker/agents/services/implementations/DeploymentManager.ts`
- Line ~595: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - COMPLETE`
- Line ~599: `[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - ERROR`

---

### **Step 9: Code Deployment to Sandbox**

**Backend:** `worker/agents/services/implementations/DeploymentManager.ts`
- Line ~471: `[FLOW_STEP_9] STEP 9: Code Deployment to Sandbox - START`
- Line ~478: `[FLOW_STEP_9] STEP 9: Code Deployment to Sandbox - ERROR`
- Line ~483: `[FLOW_STEP_9] STEP 9: Code Deployment to Sandbox - COMPLETE`

---

### **Step 10: Preview Rendering**

**Frontend:** `src/routes/chat/components/preview-iframe.tsx`
- Line ~198: `[FLOW_STEP_10] STEP 10: Preview Rendering - START`
- Line ~199: `[FLOW_STEP_10] STEP 10: Preview Rendering - COMPLETE`

---

## 🎯 How to Use These Logs

### **In Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Filter by `FLOW_STEP` to see only step tracking logs
4. Watch the flow progress step-by-step

### **In Backend Logs (Cloudflare Workers):**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. View Real-time Logs
4. Filter/search for `FLOW_STEP`

### **Identifying Breaking Points:**
1. Look for logs that show **START** but no **COMPLETE**
2. Look for **ERROR** logs - these indicate where the flow broke
3. Check the step number - that tells you exactly where it failed

---

## 📊 Example Log Output

```
[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - START {query: "create a f1 game", agentMode: "deterministic"}
[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - COMPLETE: Session created, stream available
[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - START: Reading NDJSON stream
[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS: Blueprint stream started, receiving chunks
[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - COMPLETE {totalObjects: 42, blueprintChunks: 41}
[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - PROGRESS: Waiting for structured blueprint via WebSocket
[FLOW_STEP_4] STEP 4: WebSocket Connection - START {websocketUrl: "wss://...", agentId: "..."}
[FLOW_STEP_4] STEP 4: WebSocket Connection - COMPLETE: Connection established successfully
[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - START: Requesting code generation
[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - PROGRESS: Generation started {totalFiles: 15}
[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - COMPLETE: Code generation finished
[FLOW_STEP_6] STEP 6: Sandbox Deployment → WebSocket Messages - START: Deployment initiated
[FLOW_STEP_6] STEP 6: Sandbox Instance Creation - START: Creating sandbox container
[FLOW_STEP_7] STEP 7: Template Installation & Setup - START: Installing dependencies
[FLOW_STEP_7] STEP 7: Template Installation & Setup - COMPLETE: Dependencies installed successfully
[FLOW_STEP_7] STEP 7: Template Installation & Setup - PROGRESS: Starting dev server
[FLOW_STEP_7] STEP 7: Template Installation & Setup - COMPLETE: Dev server started
[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - START: Exposing port for preview URL
[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - COMPLETE: Preview URL generated
[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - START: Testing preview availability
[FLOW_STEP_8] STEP 8: Sandbox Preview URL → GET Request - COMPLETE: Preview available (sandbox)
[FLOW_STEP_9] STEP 9: Code Deployment to Sandbox - START: Writing files to sandbox
[FLOW_STEP_9] STEP 9: Code Deployment to Sandbox - COMPLETE: Files written successfully
[FLOW_STEP_10] STEP 10: Preview Rendering - START: Waiting for page render
[FLOW_STEP_10] STEP 10: Preview Rendering - COMPLETE: Preview rendered and visible
```

---

## 🔍 Debugging Workflow

### **When Flow Breaks:**

1. **Check Browser Console:**
   - Find the last `[FLOW_STEP_X]` log
   - Identify the step that failed
   - Look for ERROR logs at that step

2. **Check Backend Logs:**
   - Search for the same step number
   - Compare frontend and backend logs
   - Identify where the disconnect happened

3. **Common Failure Patterns:**
   - **Step 1 fails** → CSRF or authentication issue
   - **Step 2 fails** → AI API issue or blueprint generation timeout
   - **Step 4 fails** → WebSocket authentication or connection issue
   - **Step 6 fails** → Container creation or quota limit
   - **Step 7 fails** → Dependency installation or dev server startup
   - **Step 8 fails** → DNS or preview URL generation issue
   - **Step 10 fails** → Preview server not responding or CORS issue

---

## ✅ Benefits

1. **Immediate Visibility:** See exactly where the flow breaks
2. **Clear Progress Tracking:** Know which steps completed successfully
3. **Easier Debugging:** Step numbers make it easy to correlate frontend/backend logs
4. **Production Monitoring:** Can filter logs by step to monitor specific issues

---

## 🔄 Next Steps

All step tracking logs are now in place. When you test the flow:

1. Open browser console
2. Watch the `[FLOW_STEP_X]` logs progress
3. If it breaks, the last log tells you exactly where
4. Check backend logs for the same step number to get full context

**Status:** ✅ **READY FOR TESTING**

