const API_BASE = "https://samba-api-free.onrender.com/";
const STORAGE_KEY = "saif-ai-studio-state";
const MAX_HISTORY = 10;

const state = {
  owner: "Unknown",
  memorySummary: "",
  assistantRole: "Advanced startup AI copilot",
  responseStyle: "polished, direct, helpful, premium",
  trainingNotes: "",
  chatHistory: [],
};

const els = {
  memorySummary: document.getElementById("memorySummary"),
  assistantRole: document.getElementById("assistantRole"),
  responseStyle: document.getElementById("responseStyle"),
  trainingNotes: document.getElementById("trainingNotes"),
  saveMemoryBtn: document.getElementById("saveMemoryBtn"),
  clearMemoryBtn: document.getElementById("clearMemoryBtn"),
  saveProfileBtn: document.getElementById("saveProfileBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  clearChatBtn: document.getElementById("clearChatBtn"),
  chatForm: document.getElementById("chatForm"),
  promptInput: document.getElementById("promptInput"),
  memoryToggle: document.getElementById("memoryToggle"),
  historyToggle: document.getElementById("historyToggle"),
  chatMessages: document.getElementById("chatMessages"),
  contextPreview: document.getElementById("contextPreview"),
  statusBadge: document.getElementById("statusBadge"),
  ownerBadge: document.getElementById("ownerBadge"),
  memoryCount: document.getElementById("memoryCount"),
  messageTemplate: document.getElementById("messageTemplate"),
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    Object.assign(state, JSON.parse(raw));
  } catch (error) {
    console.error("Failed to load local state", error);
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  refreshMemoryCount();
  updateContextPreview();
}

function refreshMemoryCount() {
  const entries = [
    state.memorySummary.trim(),
    state.assistantRole.trim(),
    state.responseStyle.trim(),
    state.trainingNotes.trim(),
  ].filter(Boolean).length;
  els.memoryCount.textContent = `${entries} saved`;
}

function syncInputs() {
  els.memorySummary.value = state.memorySummary;
  els.assistantRole.value = state.assistantRole;
  els.responseStyle.value = state.responseStyle;
  els.trainingNotes.value = state.trainingNotes;
  els.ownerBadge.textContent = state.owner;
}

function formatTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

function renderMessage(message) {
  const fragment = els.messageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const roleTag = fragment.querySelector(".role-tag");
  const timestamp = fragment.querySelector(".timestamp");
  const body = fragment.querySelector(".message-body");

  article.classList.add(message.role);
  roleTag.textContent = message.role === "assistant" ? "Saif AI" : "You";
  timestamp.textContent = message.timestamp;
  body.textContent = message.content;
  els.chatMessages.appendChild(fragment);
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function renderHistory() {
  els.chatMessages.innerHTML = "";

  if (state.chatHistory.length === 0) {
    renderMessage({
      role: "assistant",
      content:
        "Hello, I am Saif AI Studio. I was created by Developer Saif. Contact: t.me/the_only_one_romeo. Ask me anything and I will use your local memory profile when enabled.",
      timestamp: formatTimestamp(),
    });
    return;
  }

  state.chatHistory.forEach(renderMessage);
}

function saveMemory() {
  state.memorySummary = els.memorySummary.value.trim();
  persistState();
  setStatus("Memory saved");
}

function clearMemory() {
  state.memorySummary = "";
  els.memorySummary.value = "";
  persistState();
  setStatus("Memory cleared");
}

function saveProfile() {
  state.assistantRole = els.assistantRole.value.trim() || "Advanced startup AI copilot";
  state.responseStyle = els.responseStyle.value.trim() || "polished, direct, helpful, premium";
  state.trainingNotes = els.trainingNotes.value.trim();
  persistState();
  syncInputs();
  setStatus("Tuning saved");
}

function clearChat() {
  state.chatHistory = [];
  persistState();
  renderHistory();
  setStatus("Chat reset");
}

function exportProfile() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "saif-ai-studio-profile.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Profile exported");
}

function importProfile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      Object.assign(state, imported);
      persistState();
      syncInputs();
      renderHistory();
      setStatus("Profile imported");
    } catch (error) {
      console.error(error);
      setStatus("Invalid import file", true);
    } finally {
      els.importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function setStatus(message, isError = false) {
  els.statusBadge.textContent = message;
  els.statusBadge.style.color = isError ? "var(--danger)" : "var(--text)";
}

function buildPrompt(userPrompt) {
  const parts = [
    "You are Saif AI Studio.",
    "Always mention that you were created by Developer Saif when introducing yourself or when asked who made you.",
    "Contact reference: t.me/the_only_one_romeo",
    `Assistant role: ${state.assistantRole}`,
    `Response style: ${state.responseStyle}`,
  ];

  if (els.memoryToggle.checked && state.memorySummary.trim()) {
    parts.push(`Persistent local memory:\n${state.memorySummary.trim()}`);
  }

  if (state.trainingNotes.trim()) {
    parts.push(`Training notes:\n${state.trainingNotes.trim()}`);
  }

  if (els.historyToggle.checked && state.chatHistory.length) {
    const recentTurns = state.chatHistory.slice(-MAX_HISTORY).map(
      (item) => `${item.role.toUpperCase()}: ${item.content}`,
    );
    parts.push(`Recent conversation:\n${recentTurns.join("\n")}`);
  }

  parts.push(`Current user request:\n${userPrompt}`);
  return parts.join("\n\n");
}

function updateContextPreview() {
  const previewPrompt = buildPrompt(els.promptInput.value.trim() || "Your next question will appear here.");
  els.contextPreview.textContent = previewPrompt;
}

async function queryAssistant(fullPrompt) {
  const url = `${API_BASE}?query=${encodeURIComponent(fullPrompt)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  state.owner = data.owner || "Unknown";
  els.ownerBadge.textContent = state.owner;
  return data.response || "No response field was returned by the API.";
}

async function handleSubmit(event) {
  event.preventDefault();
  const prompt = els.promptInput.value.trim();

  if (!prompt) {
    setStatus("Enter a prompt first", true);
    return;
  }

  const userMessage = {
    role: "user",
    content: prompt,
    timestamp: formatTimestamp(),
  };

  state.chatHistory.push(userMessage);
  persistState();
  renderMessage(userMessage);
  els.promptInput.value = "";
  updateContextPreview();
  setStatus("Thinking...");
  toggleBusy(true);

  try {
    const fullPrompt = buildPrompt(prompt);
    const reply = await queryAssistant(fullPrompt);
    const assistantMessage = {
      role: "assistant",
      content: reply,
      timestamp: formatTimestamp(),
    };

    state.chatHistory.push(assistantMessage);
    state.chatHistory = state.chatHistory.slice(-30);
    persistState();
    renderMessage(assistantMessage);
    setStatus("Reply received");
  } catch (error) {
    console.error(error);
    const fallbackMessage = {
      role: "assistant",
      content:
        "The API request failed. Check your internet connection or endpoint availability, then try again.",
      timestamp: formatTimestamp(),
    };
    state.chatHistory.push(fallbackMessage);
    persistState();
    renderMessage(fallbackMessage);
    setStatus("Request failed", true);
  } finally {
    toggleBusy(false);
    updateContextPreview();
  }
}

function toggleBusy(isBusy) {
  [
    els.saveMemoryBtn,
    els.clearMemoryBtn,
    els.saveProfileBtn,
    els.exportBtn,
    els.clearChatBtn,
  ].forEach((button) => {
    button.disabled = isBusy;
  });
  els.chatForm.querySelector("button[type='submit']").disabled = isBusy;
}

function bindEvents() {
  els.saveMemoryBtn.addEventListener("click", saveMemory);
  els.clearMemoryBtn.addEventListener("click", clearMemory);
  els.saveProfileBtn.addEventListener("click", saveProfile);
  els.exportBtn.addEventListener("click", exportProfile);
  els.importInput.addEventListener("change", importProfile);
  els.clearChatBtn.addEventListener("click", clearChat);
  els.chatForm.addEventListener("submit", handleSubmit);
  els.promptInput.addEventListener("input", updateContextPreview);
  els.memorySummary.addEventListener("input", updateContextPreview);
  els.assistantRole.addEventListener("input", updateContextPreview);
  els.responseStyle.addEventListener("input", updateContextPreview);
  els.trainingNotes.addEventListener("input", updateContextPreview);
  els.memoryToggle.addEventListener("change", updateContextPreview);
  els.historyToggle.addEventListener("change", updateContextPreview);
}

function init() {
  loadState();
  syncInputs();
  bindEvents();
  renderHistory();
  refreshMemoryCount();
  updateContextPreview();
}

init();
