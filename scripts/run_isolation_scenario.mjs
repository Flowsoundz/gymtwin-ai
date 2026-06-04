import { setTimeout as sleep } from "node:timers/promises";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const scenario = process.argv[3] ?? "landing";
const durationMs = Number(process.argv[4] ?? 300000);
const chromeDebugUrl = process.argv[5] ?? "http://127.0.0.1:9222";

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function createTarget() {
  try {
    return await fetchJson(`${chromeDebugUrl}/json/new?about:blank`, { method: "PUT" });
  } catch {
    return fetchJson(`${chromeDebugUrl}/json/new?about:blank`);
  }
}

class CDPClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject } = this.pending.get(payload.id);
        this.pending.delete(payload.id);
        if (payload.error) {
          reject(new Error(payload.error.message ?? "CDP error"));
          return;
        }
        resolve(payload.result ?? {});
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const message = { id, method, params };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(message));
    });
  }

  async close() {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }
}

async function waitForCondition(client, expression, timeoutMs = 30000, pollMs = 250) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    if (result.result?.value) {
      return true;
    }
    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for condition: ${expression}`);
}

async function clickText(client, text, timeoutMs = 30000) {
  const escaped = JSON.stringify(text);
  const expression = `
    (() => {
      const targetText = ${escaped};
      const nodes = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const target = nodes.find((node) => {
        const content = (node.textContent || '').replace(/\\s+/g, ' ').trim();
        const rect = node.getBoundingClientRect();
        return content.includes(targetText) && rect.width > 0 && rect.height > 0;
      });
      if (!target) return false;
      target.click();
      return true;
    })();
  `;

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    if (result.result?.value) {
      return;
    }
    await sleep(250);
  }

  throw new Error(`Timed out clicking text: ${text}`);
}

async function setLocalStorageState(client) {
  const expression = `
    (() => {
      localStorage.setItem('gymtwin_onboarding_done', 'true');
      localStorage.setItem('gymtwin_safety_accepted', 'true');
      localStorage.setItem('gymtwin_camera_tried', 'true');
      localStorage.setItem('gymtwin_first_hints_shown', 'true');
      localStorage.removeItem('gymtwin_active_session');
      localStorage.setItem(
        'gymtwin_avatar_display_settings',
        JSON.stringify({
          mode: 'coach_card',
          show3DCoach: true,
          compactInWorkout: true,
          showDuringCamera: true,
          showExerciseDemos: true,
          minimalCameraHud: true,
          talkativeness: 'normal',
          repCountingEnabled: true
        })
      );
      return true;
    })();
  `;

  await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
}

async function navigateToBaseState(client) {
  await client.send("Page.navigate", { url: baseUrl });
  await waitForCondition(client, "document.readyState === 'complete'");
  await sleep(1500);
  await setLocalStorageState(client);
  await client.send("Page.reload", { ignoreCache: true });
  await waitForCondition(client, "document.readyState === 'complete'");
  await waitForCondition(client, "document.body && document.body.innerText.includes('GymTwin AI')");
  await sleep(1500);
}

async function enterCameraSandbox(client) {
  await clickText(client, "Settings");
  await waitForCondition(client, "document.body.innerText.includes('System Controls') || document.body.innerText.includes('Settings')");
  await sleep(1000);
  await clickText(client, "Open Camera Sandbox");
  await waitForCondition(client, "document.body.innerText.includes('Camera Sandbox')");
  await sleep(1500);
}

async function startCamera(client) {
  await clickText(client, "Start Camera");
  await waitForCondition(
    client,
    "document.body.innerText.includes('Camera Active') || document.body.innerText.includes('Pose Tracking Active') || document.body.innerText.includes('Camera Preview Active') || document.body.innerText.includes('Pose Model Loading...')",
    30000
  );
  await sleep(5000);
}

async function runScenario(client) {
  await navigateToBaseState(client);

  if (scenario === "landing") {
    return;
  }

  if (scenario === "camera_sandbox_idle") {
    await enterCameraSandbox(client);
    return;
  }

  if (scenario === "camera_sandbox_active") {
    await enterCameraSandbox(client);
    await startCamera(client);
    return;
  }

  throw new Error(`Unknown scenario: ${scenario}`);
}

async function main() {
  const target = await createTarget();
  const client = new CDPClient(new WebSocket(target.webSocketDebuggerUrl));
  await client.connect();

  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await runScenario(client);
    console.log(`[IsolationScenario] running ${scenario} for ${Math.round(durationMs / 1000)}s`);
    await sleep(durationMs);
  } finally {
    await client.close();
    if (target.id) {
      try {
        await fetch(`${chromeDebugUrl}/json/close/${target.id}`);
      } catch {
        // Best-effort target cleanup.
      }
    }
  }
}

await main();
