import JSZip from 'jszip';
import type { AIPlatform, ChatMessageTurn, ParsedChat, UploadedFile } from '../types';

const APOLOGY_PATTERNS = [
  /i apologize/i,
  /my apologies/i,
  /sorry for the confusion/i,
  /sorry about that/i,
  /you are absolutely right,? i made a mistake/i,
  /my mistake/i,
  /forgive me/i,
  /i stand corrected/i,
];

function detectApologies(text: string): number {
  let count = 0;
  for (const pattern of APOLOGY_PATTERNS) {
    const matches = text.match(new RegExp(pattern, 'gi'));
    if (matches) count += matches.length;
  }
  return count;
}

function detectCodeLanguages(text: string): string[] {
  const codeRegex = /```([a-zA-Z0-9_-]+)?/g;
  const langs = new Set<string>();
  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    if (match[1]) {
      const l = match[1].toLowerCase();
      if (['ts', 'typescript'].includes(l)) langs.add('TypeScript');
      else if (['js', 'javascript'].includes(l)) langs.add('JavaScript');
      else if (['py', 'python'].includes(l)) langs.add('Python');
      else if (['sql'].includes(l)) langs.add('SQL');
      else if (['html', 'css'].includes(l)) langs.add('HTML/CSS');
      else if (['json', 'yaml', 'yml'].includes(l)) langs.add('JSON/YAML');
      else if (['bash', 'sh', 'shell'].includes(l)) langs.add('Bash');
      else langs.add(match[1]);
    } else {
      langs.add('Code');
    }
  }
  return Array.from(langs);
}

function inferTopic(text: string, title: string): string {
  const combined = `${title} ${text}`.toLowerCase();
  if (/def |function |const |import |npm |git |docker|class |bug|error|stack trace|async |react|fastapi|postgres/i.test(combined)) {
    return 'Coding & Architecture';
  }
  if (/interview|salary|resume|offer|career|promotion|manager|portfolio|linkedin/i.test(combined)) {
    return 'Career & Salary';
  }
  if (/story|novel|screenplay|character|dialogue|chapter|plot|poem|narrative/i.test(combined)) {
    return 'Creative Writing';
  }
  if (/meaning of life|consciousness|simulation|ethics|nihilism|philosophy|epistemology|existential/i.test(combined)) {
    return 'Philosophy & Mind';
  }
  if (/dating|text him|text her|crush|relationship|breakup|red flag|flirting|ghosted/i.test(combined)) {
    return 'Dating & Social';
  }
  if (/stock|etf|options|crypto|bitcoin|revenue|ebitda|valuation|budget|finances/i.test(combined)) {
    return 'Finance & Wealth';
  }
  if (/system prompt|jailbreak|temperature|few-shot|chain of thought|rag|embeddings/i.test(combined)) {
    return 'Prompt Engineering';
  }
  if (/workout|protein|macros|lifting|creatine|run|cardio|sleep|supplements/i.test(combined)) {
    return 'Fitness & Lifestyle';
  }
  return 'Ideas & Strategy';
}

function inferTone(text: string, userTurnCount: number, lateNight: boolean): string {
  const lower = text.toLowerCase();
  if (lateNight && (/why|wonder|dream|fear|destiny|overthink/i.test(lower))) {
    return 'Late-Night Existential';
  }
  if (/wtf|broken|doesn't work|fail|tired of|frustrated|argh|hate this/i.test(lower)) {
    return 'Debugging Chaos';
  }
  if (/sexy|spicy|sassy|tease|roast|unhinged|slay|vibe|drama/i.test(lower)) {
    return 'Spicy & Sassy';
  }
  if (/optimize|benchmark|latency|algorithm|complexity|proof|theorem/i.test(lower)) {
    return 'High Precision';
  }
  if (userTurnCount > 8) {
    return 'Deep Dive Rabbit Hole';
  }
  return 'Curious & Analytical';
}

function calculateSpiciness(userWords: number, aiWords: number, turns: number, lateNight: boolean, tone: string): number {
  let score = 2; // base
  if (lateNight) score += 1;
  if (turns >= 6) score += 1;
  if (userWords + aiWords > 2500) score += 1;
  if (['Spicy & Sassy', 'Late-Night Existential', 'Debugging Chaos'].includes(tone)) score += 1;
  return Math.min(5, Math.max(1, score));
}

function isTimestampLateNight(dateObj: Date): boolean {
  const hours = dateObj.getHours();
  return hours >= 0 && hours < 5;
}

/** Parse ChatGPT conversations.json */
export function parseChatGPTExport(jsonStr: string, fileName = 'conversations.json'): ParsedChat[] {
  try {
    const raw = JSON.parse(jsonStr);
    const chats: ParsedChat[] = [];
    const list = Array.isArray(raw) ? raw : [raw];

    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const title = item.title || 'Untitled ChatGPT Session';
      const createTime = item.create_time ? new Date(item.create_time * 1000) : new Date();
      const messages: ChatMessageTurn[] = [];
      let modelSlug = item.default_model_slug || 'GPT-4o';
      let userWords = 0;
      let aiWords = 0;
      let apologies = 0;
      const allCodeLangs = new Set<string>();

      // ChatGPT format mapping nodes
      if (item.mapping && typeof item.mapping === 'object') {
        const nodes = Object.values(item.mapping) as any[];
        // Sort chronologically if create_time exists
        nodes.sort((a, b) => (a?.message?.create_time || 0) - (b?.message?.create_time || 0));

        for (const node of nodes) {
          const msg = node?.message;
          if (!msg || !msg.content) continue;
          const role = msg.author?.role;
          if (role !== 'user' && role !== 'assistant') continue;

          let text = '';
          if (Array.isArray(msg.content.parts)) {
            text = msg.content.parts
              .filter((p: any) => typeof p === 'string')
              .join('\n');
          } else if (typeof msg.content.text === 'string') {
            text = msg.content.text;
          }

          if (!text.trim()) continue;

          if (msg.metadata?.model_slug) {
            modelSlug = msg.metadata.model_slug;
          }

          const words = text.trim().split(/\s+/).length;
          if (role === 'user') userWords += words;
          else {
            aiWords += words;
            apologies += detectApologies(text);
          }

          const langs = detectCodeLanguages(text);
          langs.forEach((l) => allCodeLangs.add(l));

          messages.push({
            id: msg.id || Math.random().toString(36).slice(2),
            role,
            content: text,
            timestamp: msg.create_time ? new Date(msg.create_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            wordCount: words,
            codeLanguages: langs,
            hasApology: role === 'assistant' && detectApologies(text) > 0,
          });
        }
      }

      if (messages.length === 0) continue;

      const lateNight = isTimestampLateNight(createTime);
      const fullText = messages.map((m) => m.content).join(' ');
      const topic = inferTopic(fullText, title);
      const tone = inferTone(fullText, messages.filter((m) => m.role === 'user').length, lateNight);
      const spiciness = calculateSpiciness(userWords, aiWords, messages.length, lateNight, tone);

      chats.push({
        id: item.id || `chatgpt-${Math.random().toString(36).slice(2)}`,
        title,
        platform: 'ChatGPT',
        model: modelSlug.replace(/^gpt-/, 'GPT-'),
        date: createTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: createTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLateNight: lateNight,
        turnsCount: messages.length,
        userWordCount: userWords,
        aiWordCount: aiWords,
        tokenEstimate: Math.round((userWords + aiWords) * 1.33),
        primaryTopic: topic,
        tone,
        spiciness,
        codeBlocksCount: allCodeLangs.size,
        codeLanguages: Array.from(allCodeLangs),
        apologyCount: apologies,
        fileName,
        messages,
      });
    }

    return chats;
  } catch (err) {
    console.warn('Failed to parse as ChatGPT JSON:', err);
    return [];
  }
}

/** Parse Claude JSON export */
export function parseClaudeExport(jsonStr: string, fileName = 'claude_chat.json'): ParsedChat[] {
  try {
    const raw = JSON.parse(jsonStr);
    const list = Array.isArray(raw) ? raw : [raw];
    const chats: ParsedChat[] = [];

    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const title = item.name || item.title || 'Untitled Claude Chat';
      const created = item.created_at ? new Date(item.created_at) : new Date();
      const messages: ChatMessageTurn[] = [];
      let userWords = 0;
      let aiWords = 0;
      let apologies = 0;
      const allCodeLangs = new Set<string>();

      const rawMsgs = item.chat_messages || item.messages || [];
      if (Array.isArray(rawMsgs)) {
        for (const msg of rawMsgs) {
          const sender = (msg.sender || msg.role || '').toLowerCase();
          const role = sender.includes('human') || sender === 'user' ? 'user' : 'assistant';
          const text = msg.text || msg.content || '';
          if (!text.trim()) continue;

          const words = text.trim().split(/\s+/).length;
          if (role === 'user') userWords += words;
          else {
            aiWords += words;
            apologies += detectApologies(text);
          }
          const langs = detectCodeLanguages(text);
          langs.forEach((l) => allCodeLangs.add(l));

          messages.push({
            id: msg.uuid || Math.random().toString(36).slice(2),
            role,
            content: text,
            wordCount: words,
            codeLanguages: langs,
            hasApology: role === 'assistant' && detectApologies(text) > 0,
          });
        }
      }

      if (messages.length === 0) continue;

      const lateNight = isTimestampLateNight(created);
      const fullText = messages.map((m) => m.content).join(' ');
      const topic = inferTopic(fullText, title);
      const tone = inferTone(fullText, messages.filter((m) => m.role === 'user').length, lateNight);
      const spiciness = calculateSpiciness(userWords, aiWords, messages.length, lateNight, tone);

      chats.push({
        id: item.uuid || `claude-${Math.random().toString(36).slice(2)}`,
        title,
        platform: 'Claude',
        model: item.model || 'Claude 3.5 Sonnet',
        date: created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLateNight: lateNight,
        turnsCount: messages.length,
        userWordCount: userWords,
        aiWordCount: aiWords,
        tokenEstimate: Math.round((userWords + aiWords) * 1.33),
        primaryTopic: topic,
        tone,
        spiciness,
        codeBlocksCount: allCodeLangs.size,
        codeLanguages: Array.from(allCodeLangs),
        apologyCount: apologies,
        fileName,
        messages,
      });
    }

    return chats;
  } catch {
    return [];
  }
}

/** Parse Markdown chat transcripts (.md, .markdown) */
export function parseMarkdownChat(content: string, fileName: string): ParsedChat | null {
  if (!content || !content.trim()) return null;

  const lines = content.split('\n');
  let title = fileName.replace(/\.(md|markdown|txt)$/i, '').replace(/[-_]/g, ' ');
  const messages: ChatMessageTurn[] = [];

  // Check first header
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      break;
    }
  }

  // Detect platform heuristics
  let platform: AIPlatform = 'Other';
  let model = 'AI Assistant';
  if (/claude|anthropic/i.test(content) || /claude/i.test(fileName)) {
    platform = 'Claude';
    model = 'Claude 3.5 Sonnet';
  } else if (/chatgpt|gpt-4|openai|o1/i.test(content) || /chatgpt/i.test(fileName)) {
    platform = 'ChatGPT';
    model = 'GPT-4o';
  } else if (/gemini|google ai|takeout/i.test(content) || /gemini/i.test(fileName)) {
    platform = 'Gemini';
    model = 'Gemini 1.5 Pro';
  } else if (/deepseek/i.test(content)) {
    platform = 'DeepSeek';
    model = 'DeepSeek R1';
  } else if (/cursor|copilot/i.test(content)) {
    platform = 'Cursor/Copilot';
    model = 'Copilot / Sonnet';
  }

  // Split into turns
  // Typical delimiters: `### User`, `**User:**`, `User:`, `### Assistant`, `**ChatGPT:**`, etc.
  const turnDelimiter = /(?:^|\n)(?:###?\s*(User|Human|Me|Assistant|ChatGPT|Claude|Gemini|Bot|DeepSeek)|(?:\*\*(?:User|Human|Me|Assistant|ChatGPT|Claude|Gemini|DeepSeek)\*\*):?)/gi;

  const parts = content.split(turnDelimiter);
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      const header = (parts[i] || '').toLowerCase();
      const body = (parts[i + 1] || '').trim();
      if (!body) continue;

      const role = /user|human|me/i.test(header) ? 'user' : 'assistant';
      const words = body.split(/\s+/).length;
      const langs = detectCodeLanguages(body);

      messages.push({
        id: `turn-${messages.length + 1}`,
        role,
        content: body,
        wordCount: words,
        codeLanguages: langs,
        hasApology: role === 'assistant' && detectApologies(body) > 0,
      });
    }
  } else {
    // Single prompt or raw text
    const words = content.trim().split(/\s+/).length;
    messages.push({
      id: 'turn-1',
      role: 'user',
      content: content.trim(),
      wordCount: words,
      codeLanguages: detectCodeLanguages(content),
    });
  }

  if (messages.length === 0) return null;

  const now = new Date();
  const userWords = messages.filter((m) => m.role === 'user').reduce((acc, m) => acc + m.wordCount, 0);
  const aiWords = messages.filter((m) => m.role === 'assistant').reduce((acc, m) => acc + m.wordCount, 0);
  const apologies = messages.filter((m) => m.role === 'assistant').reduce((acc, m) => acc + (m.hasApology ? 1 : 0), 0);
  const allLangs = Array.from(new Set(messages.flatMap((m) => m.codeLanguages || [])));
  const topic = inferTopic(content, title);
  const tone = inferTone(content, messages.filter((m) => m.role === 'user').length, false);
  const spiciness = calculateSpiciness(userWords, aiWords, messages.length, false, tone);

  return {
    id: `md-${Math.random().toString(36).slice(2)}`,
    title,
    platform,
    model,
    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isLateNight: false,
    turnsCount: messages.length,
    userWordCount: userWords,
    aiWordCount: aiWords,
    tokenEstimate: Math.round((userWords + aiWords) * 1.33),
    primaryTopic: topic,
    tone,
    spiciness,
    codeBlocksCount: allLangs.length,
    codeLanguages: allLangs,
    apologyCount: apologies,
    fileName,
    messages,
  };
}

/** Universal File Ingestion: unzips ZIPs, parses JSONs, MDs, TXTs, CSVs */
export async function ingestChatFiles(files: File[]): Promise<ParsedChat[]> {
  const parsedChats: ParsedChat[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase();

    // 1. ZIP file (unpack in browser!)
    if (ext === 'zip') {
      try {
        const zip = await JSZip.loadAsync(file);
        const fileNames = Object.keys(zip.files);

        for (const zipPath of fileNames) {
          const zipEntry = zip.files[zipPath];
          if (zipEntry.dir) continue;
          const entryExt = zipPath.split('.').pop()?.toLowerCase();

          if (entryExt === 'json') {
            const text = await zipEntry.async('string');
            // Check for conversations.json or chat list
            const gptChats = parseChatGPTExport(text, zipPath);
            if (gptChats.length > 0) {
              parsedChats.push(...gptChats);
            } else {
              const claudeChats = parseClaudeExport(text, zipPath);
              if (claudeChats.length > 0) parsedChats.push(...claudeChats);
            }
          } else if (entryExt === 'md' || entryExt === 'markdown' || entryExt === 'txt') {
            const text = await zipEntry.async('string');
            const mdChat = parseMarkdownChat(text, zipPath);
            if (mdChat) parsedChats.push(mdChat);
          }
        }
      } catch (err) {
        console.error('Failed to unpack zip file:', file.name, err);
      }
      continue;
    }

    // 2. JSON file
    if (ext === 'json' || ext === 'jsonl') {
      const text = await file.text();
      const gptChats = parseChatGPTExport(text, file.name);
      if (gptChats.length > 0) {
        parsedChats.push(...gptChats);
        continue;
      }
      const claudeChats = parseClaudeExport(text, file.name);
      if (claudeChats.length > 0) {
        parsedChats.push(...claudeChats);
        continue;
      }
      // Generic JSON messages
      try {
        const generic = JSON.parse(text);
        if (Array.isArray(generic)) {
          const mdChat = parseMarkdownChat(JSON.stringify(generic, null, 2), file.name);
          if (mdChat) parsedChats.push(mdChat);
        }
      } catch {
        /* fallback */
      }
      continue;
    }

    // 3. Markdown / Text / PDF file
    if (['md', 'markdown', 'txt', 'pdf'].includes(ext || '')) {
      const text = await file.text();
      const chat = parseMarkdownChat(text, file.name);
      if (chat) parsedChats.push(chat);
      continue;
    }

    // 4. CSV file (could be chat log or regular tabular data)
    if (ext === 'csv') {
      const text = await file.text();
      // If it looks like chat log
      if (/role|message|speaker|prompt|response/i.test(text.slice(0, 500))) {
        const chat = parseMarkdownChat(text, file.name);
        if (chat) parsedChats.push(chat);
      }
    }
  }

  return parsedChats;
}

/** Convert normalized chats into standardized CSV datasets for Python data agent */
export function generateChatDatasetsCSV(chats: ParsedChat[]): {
  conversationsCsv: string;
  messagesCsv: string;
  topicsCsv: string;
  platformCsv: string;
} {
  // 1. Conversations CSV
  const convHeader = [
    'conversation_id',
    'title',
    'platform',
    'model',
    'date',
    'is_late_night',
    'turns_count',
    'user_words',
    'ai_words',
    'total_tokens',
    'primary_topic',
    'tone',
    'spiciness_hearts',
    'code_blocks',
    'apologies_count',
  ].join(',');

  const convRows = chats.map((c) =>
    [
      `"${c.id}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.platform}"`,
      `"${c.model}"`,
      `"${c.date}"`,
      c.isLateNight ? 'TRUE' : 'FALSE',
      c.turnsCount,
      c.userWordCount,
      c.aiWordCount,
      c.tokenEstimate,
      `"${c.primaryTopic}"`,
      `"${c.tone}"`,
      c.spiciness,
      c.codeBlocksCount,
      c.apologyCount,
    ].join(',')
  );

  const conversationsCsv = [convHeader, ...convRows].join('\n');

  // 2. Messages CSV
  const msgHeader = ['conversation_id', 'turn_index', 'role', 'word_count', 'has_apology', 'preview'].join(',');
  const msgRows: string[] = [];
  chats.forEach((c) => {
    c.messages.forEach((m, idx) => {
      const preview = m.content.slice(0, 120).replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
      msgRows.push([`"${c.id}"`, idx + 1, `"${m.role}"`, m.wordCount, m.hasApology ? 'TRUE' : 'FALSE', `"${preview}"`].join(','));
    });
  });
  const messagesCsv = [msgHeader, ...msgRows].join('\n');

  // 3. Topics Summary CSV
  const topicMap = new Map<string, { count: number; tokens: number; userWords: number; aiWords: number }>();
  chats.forEach((c) => {
    const existing = topicMap.get(c.primaryTopic) || { count: 0, tokens: 0, userWords: 0, aiWords: 0 };
    existing.count += 1;
    existing.tokens += c.tokenEstimate;
    existing.userWords += c.userWordCount;
    existing.aiWords += c.aiWordCount;
    topicMap.set(c.primaryTopic, existing);
  });

  const topicHeader = ['topic', 'chat_count', 'total_tokens', 'avg_tokens_per_chat', 'user_words', 'ai_words'].join(',');
  const topicRows = Array.from(topicMap.entries()).map(([topic, stat]) =>
    [
      `"${topic}"`,
      stat.count,
      stat.tokens,
      Math.round(stat.tokens / stat.count),
      stat.userWords,
      stat.aiWords,
    ].join(',')
  );
  const topicsCsv = [topicHeader, ...topicRows].join('\n');

  // 4. Platform Summary CSV
  const platformMap = new Map<string, { count: number; turns: number; tokens: number; apologies: number }>();
  chats.forEach((c) => {
    const existing = platformMap.get(c.platform) || { count: 0, turns: 0, tokens: 0, apologies: 0 };
    existing.count += 1;
    existing.turns += c.turnsCount;
    existing.tokens += c.tokenEstimate;
    existing.apologies += c.apologyCount;
    platformMap.set(c.platform, existing);
  });

  const platHeader = ['platform', 'chats_count', 'total_turns', 'total_tokens', 'avg_turns_per_chat', 'apologies'].join(',');
  const platRows = Array.from(platformMap.entries()).map(([plat, stat]) =>
    [
      `"${plat}"`,
      stat.count,
      stat.turns,
      stat.tokens,
      (stat.turns / stat.count).toFixed(1),
      stat.apologies,
    ].join(',')
  );
  const platformCsv = [platHeader, ...platRows].join('\n');

  return {
    conversationsCsv,
    messagesCsv,
    topicsCsv,
    platformCsv,
  };
}
