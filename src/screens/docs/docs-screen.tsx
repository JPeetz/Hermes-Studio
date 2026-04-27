export function DocsScreen() {
  const sectionStyle = { borderBottom: '1px solid var(--theme-border-subtle)', paddingBottom: '2rem', marginBottom: '2rem' }
  const h2Style = { color: 'var(--theme-text)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', marginTop: '0.5rem' }
  const h3Style = { color: 'var(--theme-text)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }
  const h4Style = { color: 'var(--theme-text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', marginTop: '1.25rem' }
  const pStyle = { color: 'var(--theme-muted)', lineHeight: 1.7, marginBottom: '0.75rem' }
  const ulStyle = { color: 'var(--theme-muted)', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '1rem' }
  const olStyle = { color: 'var(--theme-muted)', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '1rem' }
  const codeStyle = {
    background: 'var(--theme-card2)',
    border: '1px solid var(--theme-border)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.85rem',
    color: 'var(--theme-accent)',
  }
  const preStyle = {
    background: 'var(--theme-card)',
    border: '1px solid var(--theme-border)',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.8rem',
    color: 'var(--theme-muted)',
    overflowX: 'auto' as const,
    marginBottom: '1rem',
    lineHeight: 1.6,
  }
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '1.5rem',
  }
  const thStyle = {
    textAlign: 'left' as const,
    padding: '0.5rem 0.75rem',
    borderBottom: '2px solid var(--theme-border)',
    color: 'var(--theme-text)',
    fontWeight: 600,
    fontSize: '0.85rem',
  }
  const tdStyle = {
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--theme-border-subtle)',
    color: 'var(--theme-muted)',
    fontSize: '0.85rem',
    verticalAlign: 'top' as const,
  }
  const tdCodeStyle = {
    ...tdStyle,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.8rem',
    color: 'var(--theme-accent)',
  }
  const tocLinkStyle = {
    color: 'var(--theme-accent)',
    textDecoration: 'none',
    lineHeight: 2,
  }
  const noteStyle = {
    background: 'var(--theme-card)',
    border: '1px solid var(--theme-border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    color: 'var(--theme-muted)',
    fontSize: '0.9rem',
  }
  const warningStyle = {
    background: 'var(--theme-accent-subtle)',
    border: '1px solid var(--theme-accent-border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    color: 'var(--theme-accent)',
    fontSize: '0.9rem',
  }
  const dlStyle = { marginBottom: '1rem' }
  const dtStyle = { color: 'var(--theme-text)', fontWeight: 600, marginTop: '0.75rem', fontSize: '0.9rem' }
  const ddStyle = { color: 'var(--theme-muted)', marginLeft: '1.5rem', marginBottom: '0.25rem', fontSize: '0.85rem', lineHeight: 1.6 }

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: 'var(--theme-bg)' }}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 style={{ color: 'var(--theme-text)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Hermes Studio Documentation
        </h1>
        <p style={{ color: 'var(--theme-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Version 1.20.0 — Comprehensive technical reference for architecture, APIs, configuration, and advanced usage.
        </p>

        {/* ════════════════════════════════════════════════════════════════
            TABLE OF CONTENTS
        ════════════════════════════════════════════════════════════════ */}
        <nav style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '1.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--theme-text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Table of Contents</h2>
          <ol style={{ ...olStyle, columns: 2, columnGap: '2rem' }}>
            <li><a href="#overview" style={tocLinkStyle}>Overview</a></li>
            <li><a href="#screens-reference" style={tocLinkStyle}>Screens Reference</a></li>
            <li><a href="#chat-system" style={tocLinkStyle}>Chat System</a></li>
            <li><a href="#multi-agent" style={tocLinkStyle}>Multi-Agent Orchestration</a></li>
            <li><a href="#task-management" style={tocLinkStyle}>Task Management</a></li>
            <li><a href="#cron-jobs" style={tocLinkStyle}>Cron Job Management</a></li>
            <li><a href="#knowledge-system" style={tocLinkStyle}>Knowledge System</a></li>
            <li><a href="#skills-ecosystem" style={tocLinkStyle}>Skills Ecosystem</a></li>
            <li><a href="#agent-library" style={tocLinkStyle}>Agent Library</a></li>
            <li><a href="#files-terminal" style={tocLinkStyle}>File Management &amp; Terminal</a></li>
            <li><a href="#analytics-observability" style={tocLinkStyle}>Analytics &amp; Observability</a></li>
            <li><a href="#api-reference" style={tocLinkStyle}>API Reference</a></li>
            <li><a href="#configuration" style={tocLinkStyle}>Configuration Reference</a></li>
            <li><a href="#design-system" style={tocLinkStyle}>Design System</a></li>
            <li><a href="#gateway-integration" style={tocLinkStyle}>Gateway Integration</a></li>
            <li><a href="#security" style={tocLinkStyle}>Security</a></li>
            <li><a href="#keyboard-shortcuts" style={tocLinkStyle}>Keyboard Shortcuts</a></li>
          </ol>
        </nav>

        {/* ════════════════════════════════════════════════════════════════
            1. OVERVIEW
        ════════════════════════════════════════════════════════════════ */}
        <section id="overview" style={sectionStyle}>
          <h2 style={h2Style}>1. Overview</h2>

          <h3 style={h3Style}>What is Hermes Studio</h3>
          <p style={pStyle}>
            Hermes Studio is a full-featured web-based control panel for managing, monitoring, and orchestrating AI agents running on the Hermes Gateway. It provides a rich graphical interface for chat, multi-agent coordination, task tracking, memory management, skill installation, cron job scheduling, and system observability. The application is designed as a single-page progressive web app that connects to one or more Hermes Gateway instances via HTTP and Server-Sent Events (SSE).
          </p>

          <h3 style={h3Style}>Architecture</h3>
          <p style={pStyle}>
            Hermes Studio is built on a modern full-stack TypeScript architecture:
          </p>
          <ul style={ulStyle}>
            <li><strong>Frontend:</strong> React 19 with TypeScript, rendered client-side as an SPA.</li>
            <li><strong>Routing:</strong> TanStack Router (file-based route generation) with type-safe route params and search params.</li>
            <li><strong>Data Fetching:</strong> TanStack Query for server state management with automatic caching, refetching, and optimistic updates.</li>
            <li><strong>Build System:</strong> Vite with TanStack Start for SSR-capable bundling, HMR, and production builds.</li>
            <li><strong>Server Layer:</strong> TanStack Start server functions handle API routes. The server process runs as a Node.js HTTP server that proxies to the Hermes Gateway.</li>
            <li><strong>State Management:</strong> Zustand with persist middleware for client settings. React state and TanStack Query for ephemeral/server state.</li>
            <li><strong>Styling:</strong> Tailwind CSS 4 with a custom CSS variable theming layer. All colors are theme-aware via <code style={codeStyle}>var(--theme-*)</code> tokens.</li>
          </ul>

          <h3 style={h3Style}>Gateway Connection Model</h3>
          <p style={pStyle}>
            Hermes Studio does not directly communicate with LLM providers. Instead, it connects to a Hermes Gateway server that manages agent sessions, tool execution, memory, and provider routing. The connection model works as follows:
          </p>
          <ol style={olStyle}>
            <li>On startup, the Studio server probes the configured gateway URL to detect available capabilities.</li>
            <li>Capabilities are classified as <strong>Core</strong> (health, chat completions, models, streaming) or <strong>Enhanced</strong> (sessions, skills, memory, config, jobs).</li>
            <li>If enhanced capabilities are detected, Studio operates in full-featured mode with session management, tools, and approval workflows.</li>
            <li>If only core capabilities are available, Studio degrades gracefully to a basic chat interface.</li>
            <li>Capability probing results are cached for 120 seconds and refreshed automatically.</li>
          </ol>

          <h3 style={h3Style}>Feature Matrix</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Feature</th>
                <th style={thStyle}>Core Mode</th>
                <th style={thStyle}>Enhanced Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Chat with streaming</td><td style={tdStyle}>Yes</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Session management</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Tool execution &amp; approvals</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Multi-agent crews</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Conductor orchestration</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Cron jobs</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Memory &amp; knowledge</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Skills installation</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>File browser</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Terminal</td><td style={tdStyle}>No</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Analytics</td><td style={tdStyle}>Partial</td><td style={tdStyle}>Yes</td></tr>
              <tr><td style={tdStyle}>Model selection</td><td style={tdStyle}>Yes</td><td style={tdStyle}>Yes</td></tr>
            </tbody>
          </table>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            2. SCREENS REFERENCE
        ════════════════════════════════════════════════════════════════ */}
        <section id="screens-reference" style={sectionStyle}>
          <h2 style={h2Style}>2. Screens Reference</h2>
          <p style={pStyle}>
            Hermes Studio contains 18 distinct screens, each accessible via the sidebar navigation or keyboard shortcuts. Below is a reference for each screen.
          </p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Screen</th>
                <th style={thStyle}>Route</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><strong>Dashboard</strong></td>
                <td style={tdCodeStyle}>/dashboard</td>
                <td style={tdStyle}>System overview with active session count, token usage sparklines, gateway connection status, recent activity feed, and quick-launch cards for common actions. Displays real-time area charts of context usage over the past 24 hours.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Chat</strong></td>
                <td style={tdCodeStyle}>/chat/:sessionKey</td>
                <td style={tdStyle}>Primary conversational interface. Features session sidebar, streaming message display, approval cards, attachment handling, inspector panel, context meter, and multi-model selection. Supports both enhanced Hermes sessions and portable chat completions.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Files</strong></td>
                <td style={tdCodeStyle}>/files</td>
                <td style={tdStyle}>Profile-scoped file browser with tree navigation, Monaco editor integration for viewing and editing files with syntax highlighting, search, and configurable font size, word wrap, and minimap settings.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Terminal</strong></td>
                <td style={tdCodeStyle}>/terminal</td>
                <td style={tdStyle}>Integrated PTY terminal powered by Xterm.js. Supports persistent terminal sessions, resize events, ANSI color rendering, and clipboard integration. Sessions survive page refreshes.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Jobs</strong></td>
                <td style={tdCodeStyle}>/jobs</td>
                <td style={tdStyle}>Cron job management with creation wizard, schedule presets, delivery channel configuration, live run streaming via SSE, run history, and job lifecycle controls (pause, resume, delete, run now).</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Crews</strong></td>
                <td style={tdCodeStyle}>/crews</td>
                <td style={tdStyle}>Multi-agent team management. Create crews from templates or scratch, configure members with personas and models, build DAG workflows, dispatch missions, track token costs, and clone crews with fresh sessions.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Crew Detail</strong></td>
                <td style={tdCodeStyle}>/crews/:crewId</td>
                <td style={tdStyle}>Individual crew management with member roster, workflow DAG editor, dispatch dialog, cost panel with per-member token breakdown, and crew settings.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Conductor</strong></td>
                <td style={tdCodeStyle}>/conductor</td>
                <td style={tdStyle}>Mission orchestration system. Enter a high-level goal, observe automated task decomposition, monitor worker agents in the Office View (Grid, Roundtable, or War Room layouts), track costs, and review completed mission outputs.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Operations</strong></td>
                <td style={tdCodeStyle}>/operations</td>
                <td style={tdStyle}>Real-time operational overview showing all active agent sessions in a grid layout, with status indicators, last activity timestamps, and output previews. Useful for monitoring multi-agent workloads.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Tasks</strong></td>
                <td style={tdCodeStyle}>/tasks</td>
                <td style={tdStyle}>Kanban-style task board with five columns (Backlog, Todo, In Progress, Review, Done). Supports drag-and-drop, priority levels, tags, assignee linking, and source URL references.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Agents</strong></td>
                <td style={tdCodeStyle}>/agents</td>
                <td style={tdStyle}>Agent persona library with built-in and custom agents. Create agents with emoji avatars, accent colors, system prompts, model overrides, and specialty tags. Agents integrate with crews and conductor.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Patterns</strong></td>
                <td style={tdCodeStyle}>/patterns</td>
                <td style={tdStyle}>Patterns and corrections system for managing reusable prompt patterns, behavior corrections, and agent guidelines that persist across sessions.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Analytics</strong></td>
                <td style={tdCodeStyle}>/analytics</td>
                <td style={tdStyle}>Event analytics with 14-day stacked bar charts showing tool usage frequency, message volume, and session activity. Includes provider usage breakdown and context window utilization graphs.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Session History</strong></td>
                <td style={tdCodeStyle}>/session-history</td>
                <td style={tdStyle}>Two-pane archive interface for browsing past sessions. Left pane shows session list with metadata; right pane lazy-loads full message threads with search and filter capabilities.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Audit Trail</strong></td>
                <td style={tdCodeStyle}>/audit</td>
                <td style={tdStyle}>Chronological event log filterable by event type, session, and date range. Records all significant system events including approvals, tool executions, session lifecycle changes, and configuration modifications.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Logs</strong></td>
                <td style={tdCodeStyle}>/logs</td>
                <td style={tdStyle}>Gateway log viewer displaying the last 500 lines of system logs with color-coded severity levels (debug, info, warn, error). Supports auto-scroll and manual pause.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Memory</strong></td>
                <td style={tdCodeStyle}>/memory</td>
                <td style={tdStyle}>Memory browser for viewing and editing identity files (SOUL.md, persona.md, CLAUDE.md), plus a knowledge graph visualization with force-directed layout and wikilink detection.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Skills</strong></td>
                <td style={tdCodeStyle}>/skills</td>
                <td style={tdStyle}>Skill registry browser with 2000+ available skills from skillsmp.com. Install, uninstall, enable/disable skills, view documentation, and search the hub for new capabilities.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Profiles</strong></td>
                <td style={tdCodeStyle}>/profiles</td>
                <td style={tdStyle}>Profile management for switching between different gateway configurations. Create, rename, activate, and delete profiles. Each profile maintains independent settings, memory files, and skill installations.</td>
              </tr>
              <tr>
                <td style={tdStyle}><strong>Settings</strong></td>
                <td style={tdCodeStyle}>/settings</td>
                <td style={tdStyle}>Application configuration including gateway connection, appearance (theme, accent color), editor preferences (font size, word wrap, minimap), notification settings, model preferences, and MCP server configuration.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            3. CHAT SYSTEM
        ════════════════════════════════════════════════════════════════ */}
        <section id="chat-system" style={sectionStyle}>
          <h2 style={h2Style}>3. Chat System</h2>

          <h3 style={h3Style}>Session Management</h3>
          <p style={pStyle}>
            Every conversation in Hermes Studio exists within a session. Sessions are server-managed entities created on the Hermes Gateway. Each session maintains its own context window, message history, tool permissions, and memory state.
          </p>
          <ul style={ulStyle}>
            <li><strong>Creation:</strong> Sessions are created via <code style={codeStyle}>POST /api/sessions</code> which delegates to the gateway. Each session receives a unique key (UUID format).</li>
            <li><strong>Switching:</strong> The chat sidebar displays all active sessions. Clicking a session triggers a route change to <code style={codeStyle}>/chat/:sessionKey</code> and loads the message history.</li>
            <li><strong>Deletion:</strong> Sessions can be deleted from the sidebar context menu. This removes the session from the gateway and clears associated message history.</li>
            <li><strong>Renaming:</strong> Sessions can be renamed for easier identification. Names are stored as metadata on the gateway session object.</li>
            <li><strong>Status Polling:</strong> The chat screen polls <code style={codeStyle}>GET /api/sessions/:sessionKey/status</code> to detect agent state changes (idle, active, waiting_for_input).</li>
          </ul>

          <h3 style={h3Style}>SSE Streaming Architecture</h3>
          <p style={pStyle}>
            Message streaming uses Server-Sent Events (SSE) for real-time delivery of agent responses. The architecture works as follows:
          </p>
          <ol style={olStyle}>
            <li>User sends a message via <code style={codeStyle}>POST /api/sessions/send</code> which dispatches to the gateway.</li>
            <li>The client opens an SSE connection to <code style={codeStyle}>GET /api/chat-events</code> with the session key as a query parameter.</li>
            <li>The server proxies SSE events from the Hermes Gateway, forwarding token-by-token streaming data.</li>
            <li>Events include: <code style={codeStyle}>message_start</code>, <code style={codeStyle}>content_delta</code>, <code style={codeStyle}>content_end</code>, <code style={codeStyle}>tool_use</code>, <code style={codeStyle}>tool_result</code>, <code style={codeStyle}>approval_required</code>, <code style={codeStyle}>error</code>.</li>
            <li>The client accumulates deltas into complete messages, updating the React state incrementally for smooth rendering.</li>
            <li>When the stream ends (either naturally or via abort), the client reconciles with the full message history from the gateway.</li>
          </ol>

          <h3 style={h3Style}>Message Persistence</h3>
          <p style={pStyle}>
            Messages are persisted by the Hermes Gateway using a tiered storage strategy:
          </p>
          <ul style={ulStyle}>
            <li><strong>Primary (Redis):</strong> When <code style={codeStyle}>REDIS_URL</code> is configured, messages are stored in Redis sorted sets keyed by session. This provides fast retrieval and supports TTL-based expiration.</li>
            <li><strong>Fallback (File):</strong> When Redis is unavailable, messages fall back to file-based storage in the <code style={codeStyle}>.runtime/</code> directory as JSON files per session.</li>
            <li><strong>Session tokens:</strong> Authentication tokens are persisted in a Redis SET (<code style={codeStyle}>hermes:studio:tokens</code>) with a 30-day TTL, falling back to in-memory storage.</li>
          </ul>

          <h3 style={h3Style}>Approval Workflow</h3>
          <p style={pStyle}>
            When an agent attempts a privileged action (file writes, command execution, network access), the gateway emits an <code style={codeStyle}>approval_required</code> event. The Studio UI renders an ApprovalCard with three resolution options:
          </p>
          <ul style={ulStyle}>
            <li><strong>Approve (once):</strong> Permits the specific action instance. Scope: this single invocation only.</li>
            <li><strong>Deny:</strong> Rejects the action. The agent receives a denial signal and may propose an alternative approach.</li>
            <li><strong>Always Allow:</strong> Grants permanent permission for this action pattern. Three scopes are available:
              <ul style={ulStyle}>
                <li><strong>once</strong> — Allow this exact action one time.</li>
                <li><strong>session</strong> — Allow this action type for the remainder of the current session.</li>
                <li><strong>always</strong> — Permanently allow this action type across all sessions.</li>
              </ul>
            </li>
          </ul>
          <p style={pStyle}>
            Approvals are resolved via <code style={codeStyle}>POST /api/approvals/:approvalId/approve</code> or <code style={codeStyle}>POST /api/approvals/:approvalId/deny</code>. The approval card displays the action name, agent identity, and expandable context showing full arguments.
          </p>

          <h3 style={h3Style}>Inspector Panel</h3>
          <p style={pStyle}>
            The chat inspector panel provides diagnostic visibility into the current session state. It displays active tool calls, pending approvals, token usage breakdown (input/output/cache), context window utilization as a percentage meter, and the raw event stream for debugging. The context bar shows real-time consumption with color thresholds (green under 60%, amber 60-85%, red above 85%).
          </p>

          <h3 style={h3Style}>Attachment Handling</h3>
          <p style={pStyle}>
            The chat composer supports file attachments. Files are uploaded and converted to appropriate formats for the LLM (images become base64-encoded vision inputs, text files become inline content blocks). The research card component displays structured research outputs with collapsible sections and source citations.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            4. MULTI-AGENT ORCHESTRATION
        ════════════════════════════════════════════════════════════════ */}
        <section id="multi-agent" style={sectionStyle}>
          <h2 style={h2Style}>4. Multi-Agent Orchestration</h2>

          <h3 style={h3Style}>4a. Crews</h3>

          <h4 style={h4Style}>Crew Lifecycle</h4>
          <p style={pStyle}>
            Crews follow a defined lifecycle from creation through execution:
          </p>
          <ol style={olStyle}>
            <li><strong>Create:</strong> Define a crew via the creation dialog or by selecting a template from the gallery. Set a name, description, and initial member roster.</li>
            <li><strong>Configure:</strong> Assign personas, models, and system prompts to each member. Optionally build a workflow DAG defining execution order and dependencies.</li>
            <li><strong>Dispatch:</strong> Launch the crew on a mission via the dispatch dialog. Provide a goal prompt, select the execution strategy (parallel, sequential, or DAG-ordered), and confirm.</li>
            <li><strong>Monitor:</strong> Track progress in real-time. Each member's session status, output, and token usage updates live. The cost panel shows per-member and total spend.</li>
          </ol>

          <h4 style={h4Style}>Member Management</h4>
          <p style={pStyle}>
            Each crew member represents an agent session with specific configuration:
          </p>
          <ul style={ulStyle}>
            <li><strong>Persona:</strong> Selected from the agent library (built-in or custom). Determines the system prompt, avatar, and specialty tags.</li>
            <li><strong>Model:</strong> Override the default model per member. Useful for assigning cheaper models to simpler tasks and premium models to complex reasoning.</li>
            <li><strong>Session:</strong> Each member gets a dedicated gateway session that persists across dispatches. Sessions can be reset or re-minted.</li>
          </ul>

          <h4 style={h4Style}>Template System</h4>
          <p style={pStyle}>
            Hermes Studio includes 7 built-in crew templates plus support for user-created custom templates. Templates are categorized:
          </p>
          <ul style={ulStyle}>
            <li><strong>Research:</strong> Templates for investigation, analysis, and report generation.</li>
            <li><strong>Engineering:</strong> Templates for code review, architecture, and implementation tasks.</li>
            <li><strong>Creative:</strong> Templates for content creation, brainstorming, and design.</li>
            <li><strong>Operations:</strong> Templates for deployment, monitoring, and maintenance workflows.</li>
            <li><strong>Conductor:</strong> Templates optimized for the conductor orchestration pattern.</li>
          </ul>
          <p style={pStyle}>
            Custom templates can be created from any existing crew configuration and are persisted via <code style={codeStyle}>POST /api/crews/templates</code>. User templates can be deleted; built-in templates are read-only.
          </p>

          <h4 style={h4Style}>Workflow Builder</h4>
          <p style={pStyle}>
            The workflow builder is a visual DAG (Directed Acyclic Graph) editor for defining execution dependencies between crew members. Key features:
          </p>
          <ul style={ulStyle}>
            <li>Drag-and-drop node placement with automatic layout.</li>
            <li>Edge creation by clicking source and target nodes.</li>
            <li>Cycle detection — the editor prevents creating edges that would form cycles, ensuring a valid topological order.</li>
            <li>Parallel execution — nodes without dependencies run concurrently.</li>
            <li>Workflow state is persisted per crew via <code style={codeStyle}>PUT /api/crews/:crewId/workflow</code>.</li>
          </ul>

          <h4 style={h4Style}>Token Usage Tracking</h4>
          <p style={pStyle}>
            The cost panel (<code style={codeStyle}>GET /api/crews/:crewId/usage</code>) provides per-member token breakdowns showing input tokens, output tokens, cache read/write tokens, and estimated cost. Costs use a blended rate of approximately $5 per million tokens.
          </p>

          <h4 style={h4Style}>Clone with Session Minting</h4>
          <p style={pStyle}>
            Crews can be cloned via <code style={codeStyle}>POST /api/crews/:crewId/clone</code>. Cloning creates a duplicate crew with fresh sessions for all members, preserving the workflow DAG and configuration but resetting all conversation state. This is useful for re-running experiments or creating variants.
          </p>

          <h3 style={h3Style}>4b. Conductor V2</h3>

          <h4 style={h4Style}>Gateway-Native Architecture</h4>
          <p style={pStyle}>
            The Conductor V2 system uses a gateway-native approach where orchestration is performed by a dedicated Hermes agent session rather than client-side logic. The orchestrator agent receives a mission goal and a dispatch skill, then autonomously decomposes the work and spawns worker sessions.
          </p>

          <h4 style={h4Style}>Mission Phases</h4>
          <p style={pStyle}>
            A conductor mission progresses through four phases:
          </p>
          <ol style={olStyle}>
            <li><strong>idle:</strong> No active mission. The UI shows the mission input form and history.</li>
            <li><strong>decomposing:</strong> The orchestrator agent is analyzing the goal and planning task allocation. The UI shows a thinking indicator.</li>
            <li><strong>running:</strong> Worker agents have been spawned and are executing tasks. The Office View displays real-time progress.</li>
            <li><strong>complete:</strong> All workers have finished. The UI shows the summary with outputs, costs, and mission duration.</li>
          </ol>

          <h4 style={h4Style}>Spawn Flow</h4>
          <p style={pStyle}>
            The spawn sequence is:
          </p>
          <ol style={olStyle}>
            <li>Client sends <code style={codeStyle}>POST /api/conductor-spawn</code> with the goal, orchestrator model, worker model, projects directory, max parallel count, and supervised flag.</li>
            <li>The server loads the workspace-dispatch skill from disk (searching multiple candidate paths).</li>
            <li>An orchestrator prompt is constructed combining the goal with the dispatch skill instructions.</li>
            <li>A Hermes cron job is created on the gateway to run the orchestrator as a one-shot task.</li>
            <li>The orchestrator agent decomposes the goal and spawns worker sessions via the dispatch skill.</li>
            <li>The client polls worker session statuses every 3 seconds to track progress.</li>
          </ol>

          <h4 style={h4Style}>Live Monitoring</h4>
          <p style={pStyle}>
            During the running phase, the client monitors worker agents through:
          </p>
          <ul style={ulStyle}>
            <li><strong>3-second polling:</strong> Session status is fetched for all active workers at a 3-second interval.</li>
            <li><strong>Staleness detection:</strong> Workers that haven't reported activity within a threshold are marked as potentially stale.</li>
            <li><strong>Completion detection:</strong> When all workers report idle/complete status, the mission transitions to the complete phase.</li>
            <li><strong>Office View:</strong> Real-time visualization of all workers with status indicators, current task labels, and output previews.</li>
          </ul>

          <h4 style={h4Style}>Conductor Settings</h4>
          <p style={pStyle}>
            The settings drawer provides configuration for:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>Orchestrator Model</dt>
            <dd style={ddStyle}>The LLM model used for task decomposition and coordination. Defaults to auto (gateway default). Premium models (Claude Opus, GPT-4) recommended for complex missions.</dd>
            <dt style={dtStyle}>Worker Model</dt>
            <dd style={ddStyle}>The LLM model assigned to spawned worker agents. Can use cheaper models (Claude Sonnet, GPT-4o-mini) for cost efficiency.</dd>
            <dt style={dtStyle}>Projects Directory</dt>
            <dd style={ddStyle}>Base directory where worker outputs are written. Defaults to <code style={codeStyle}>/tmp</code>. Set to your workspace root for persistent outputs.</dd>
            <dt style={dtStyle}>Max Parallel (1-5)</dt>
            <dd style={ddStyle}>Maximum number of worker agents that can run concurrently. Higher values increase throughput but consume more resources and API quota.</dd>
            <dt style={dtStyle}>Supervised</dt>
            <dd style={ddStyle}>When enabled, worker agents require approval for tool use. When disabled, workers operate autonomously.</dd>
          </dl>

          <h4 style={h4Style}>Office View Layouts</h4>
          <p style={pStyle}>
            The Office View provides three visualization layouts for monitoring workers:
          </p>
          <ul style={ulStyle}>
            <li><strong>Grid (4x3):</strong> Traditional grid arrangement showing up to 12 agent cards in rows. Each card displays the agent avatar, name, status glow, current task, and last output line.</li>
            <li><strong>Roundtable (circular):</strong> Agents arranged in a circle around a central mission summary. Emphasizes equal participation and cross-agent awareness.</li>
            <li><strong>War Room (facing rows):</strong> Two rows of agents facing each other, simulating a collaborative workspace. Status bars and speech bubbles show real-time activity.</li>
          </ul>
          <p style={pStyle}>
            Layout preference is persisted in localStorage under the key <code style={codeStyle}>hermes-studio:office-layout</code>.
          </p>

          <h4 style={h4Style}>Agent Avatar System</h4>
          <p style={pStyle}>
            Each conductor worker is assigned a unique pixel-art SVG robot avatar. The system provides:
          </p>
          <ul style={ulStyle}>
            <li><strong>10 avatar variants:</strong> Different robot body shapes with distinct head, body, arm, and leg geometry rendered as SVG pixel art.</li>
            <li><strong>10 accent colors:</strong> Orange, Blue, Violet, Emerald, Rose, Amber, Cyan, Fuchsia, Lime, Sky. Each color provides bar, border, avatar, text, ring, and hex values.</li>
            <li>Avatars are assigned deterministically based on agent index, ensuring consistent visual identity across sessions.</li>
          </ul>

          <h4 style={h4Style}>Mission History</h4>
          <p style={pStyle}>
            Completed missions are stored in localStorage with a maximum of 50 entries. Each history entry records the goal, start/end timestamps, worker count, total cost, and completion status. The history panel on the home screen allows reviewing past missions and re-launching similar goals.
          </p>

          <h4 style={h4Style}>Cost Tracking</h4>
          <p style={pStyle}>
            The conductor tracks estimated costs using a blended rate of approximately $5 per 1 million tokens. The cost tracker component displays real-time accumulation during mission execution, with per-worker breakdowns available on hover. Final costs are recorded in the mission history entry.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            5. TASK MANAGEMENT
        ════════════════════════════════════════════════════════════════ */}
        <section id="task-management" style={sectionStyle}>
          <h2 style={h2Style}>5. Task Management</h2>

          <h3 style={h3Style}>Kanban Board</h3>
          <p style={pStyle}>
            The Tasks screen implements a five-column Kanban board for tracking work items. Tasks flow left-to-right through the following columns:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Column</th>
                <th style={thStyle}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}><strong>Backlog</strong></td><td style={tdStyle}>Captured ideas and future work not yet prioritized.</td></tr>
              <tr><td style={tdStyle}><strong>Todo</strong></td><td style={tdStyle}>Prioritized work ready to be started in the next cycle.</td></tr>
              <tr><td style={tdStyle}><strong>In Progress</strong></td><td style={tdStyle}>Actively being worked on by a human or agent.</td></tr>
              <tr><td style={tdStyle}><strong>Review</strong></td><td style={tdStyle}>Work completed, awaiting review or validation.</td></tr>
              <tr><td style={tdStyle}><strong>Done</strong></td><td style={tdStyle}>Completed and accepted work.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Task Properties</h3>
          <p style={pStyle}>
            Each task supports the following properties:
          </p>
          <ul style={ulStyle}>
            <li><strong>Title:</strong> Short descriptive name for the task.</li>
            <li><strong>Description:</strong> Detailed explanation of the work required (supports markdown).</li>
            <li><strong>Priority:</strong> One of low, medium, high, or critical. Displayed as color-coded badges.</li>
            <li><strong>Tags:</strong> Arbitrary string labels for categorization and filtering.</li>
            <li><strong>Assignee:</strong> Link to an agent persona or human identifier.</li>
            <li><strong>Source Links:</strong> URLs referencing external resources (GitHub issues, docs, etc.).</li>
            <li><strong>Column:</strong> Current Kanban column (determines board position).</li>
          </ul>

          <h3 style={h3Style}>HTML5 Drag-and-Drop</h3>
          <p style={pStyle}>
            Tasks can be moved between columns using native HTML5 drag-and-drop. When a card is dragged to a new column, a <code style={codeStyle}>PATCH /api/tasks/:taskId/move</code> request updates the server state. The board uses optimistic updates for instant visual feedback, reverting on failure. Cards can also be reordered within a column to set priority ordering.
          </p>

          <h3 style={h3Style}>Cross-Linking</h3>
          <p style={pStyle}>
            Tasks integrate with other Hermes Studio systems:
          </p>
          <ul style={ulStyle}>
            <li>Tasks can be created from conductor mission outputs, linking the task to the originating mission.</li>
            <li>Crew dispatch results can generate review tasks automatically.</li>
            <li>Task assignees can reference agent personas from the agent library.</li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            6. CRON JOB MANAGEMENT
        ════════════════════════════════════════════════════════════════ */}
        <section id="cron-jobs" style={sectionStyle}>
          <h2 style={h2Style}>6. Cron Job Management</h2>

          <h3 style={h3Style}>Job Lifecycle</h3>
          <p style={pStyle}>
            Cron jobs in Hermes Studio follow a lifecycle:
          </p>
          <ol style={olStyle}>
            <li><strong>Create:</strong> Define a job with a name, prompt/instruction, schedule, and delivery configuration.</li>
            <li><strong>Schedule:</strong> The gateway registers the job with its cron expression and begins scheduling.</li>
            <li><strong>Run:</strong> At each scheduled time, the gateway spawns a one-shot agent session that executes the job prompt.</li>
            <li><strong>Monitor:</strong> Run progress streams via SSE. Outputs are captured and stored in run history.</li>
          </ol>

          <h3 style={h3Style}>Schedule Presets and Cron Expressions</h3>
          <p style={pStyle}>
            The job creation dialog offers common schedule presets:
          </p>
          <ul style={ulStyle}>
            <li>Every 5 minutes, Every 15 minutes, Every hour</li>
            <li>Every 6 hours, Every 12 hours, Daily at midnight</li>
            <li>Weekly (Monday 9am), Monthly (1st at midnight)</li>
          </ul>
          <p style={pStyle}>
            Advanced users can enter arbitrary cron expressions using standard 5-field format: <code style={codeStyle}>minute hour day-of-month month day-of-week</code>. The UI validates expressions and shows a human-readable interpretation.
          </p>

          <h3 style={h3Style}>Delivery Channels</h3>
          <p style={pStyle}>
            Job outputs can be delivered through multiple channels:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Channel</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}><strong>Local</strong></td><td style={tdStyle}>Output stored in run history, viewable in the Studio UI.</td></tr>
              <tr><td style={tdStyle}><strong>Telegram</strong></td><td style={tdStyle}>Send output as a Telegram message to a configured bot/chat.</td></tr>
              <tr><td style={tdStyle}><strong>Discord</strong></td><td style={tdStyle}>Post output to a Discord channel via webhook.</td></tr>
              <tr><td style={tdStyle}><strong>Slack</strong></td><td style={tdStyle}>Send output to a Slack channel via incoming webhook.</td></tr>
              <tr><td style={tdStyle}><strong>Signal</strong></td><td style={tdStyle}>Deliver output via Signal messenger integration.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Live Run Streaming</h3>
          <p style={pStyle}>
            When a job is running (either scheduled or manually triggered), the output streams in real-time via SSE at <code style={codeStyle}>GET /api/hermes-runs/:runId/events</code>. The Studio UI renders streaming output with the same message formatting used in chat, including tool use indicators and markdown rendering.
          </p>

          <h3 style={h3Style}>Run History</h3>
          <p style={pStyle}>
            Each job maintains a history of past runs accessible via <code style={codeStyle}>GET /api/hermes-runs</code>. Run entries include start time, duration, exit status (success/failure/timeout), token usage, and the complete output text. The jobs screen displays recent runs in a timeline view with expandable output panels.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            7. KNOWLEDGE SYSTEM
        ════════════════════════════════════════════════════════════════ */}
        <section id="knowledge-system" style={sectionStyle}>
          <h2 style={h2Style}>7. Knowledge System</h2>

          <h3 style={h3Style}>Memory Browser</h3>
          <p style={pStyle}>
            The memory browser provides access to the agent's identity and knowledge files. These markdown files define the agent's personality, capabilities, and contextual information:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>SOUL.md</dt>
            <dd style={ddStyle}>Core identity file defining the agent's fundamental personality, values, communication style, and behavioral guidelines. Always loaded into context.</dd>
            <dt style={dtStyle}>persona.md</dt>
            <dd style={ddStyle}>Current active persona configuration including name, role, specialties, and interaction preferences. Can be swapped to change agent behavior.</dd>
            <dt style={dtStyle}>CLAUDE.md</dt>
            <dd style={ddStyle}>Project-specific instructions and context. Typically contains codebase conventions, architecture notes, and project-specific rules.</dd>
          </dl>
          <p style={pStyle}>
            Files are read via <code style={codeStyle}>GET /api/memory/read</code> and written via <code style={codeStyle}>POST /api/memory/write</code>. The browser includes a Monaco editor for inline editing with markdown preview.
          </p>

          <h3 style={h3Style}>Knowledge Graph</h3>
          <p style={pStyle}>
            The knowledge graph provides a force-directed visualization of relationships between knowledge entries. Built with D3-style physics simulation:
          </p>
          <ul style={ulStyle}>
            <li><strong>Nodes:</strong> Each knowledge file or memory entry becomes a node. Size reflects content length; color indicates file type.</li>
            <li><strong>Edges:</strong> Connections are detected via wikilink syntax (<code style={codeStyle}>[[target]]</code>) within documents. Edges represent cross-references between knowledge items.</li>
            <li><strong>Physics:</strong> Force-directed layout with charge repulsion, link attraction, and center gravity. Nodes can be dragged and pinned.</li>
            <li><strong>Search:</strong> Full-text search via <code style={codeStyle}>GET /api/knowledge/search</code> highlights matching nodes and filters the graph display.</li>
          </ul>
          <p style={pStyle}>
            The graph data is fetched from <code style={codeStyle}>GET /api/knowledge/graph</code> which returns nodes and edges as JSON. The knowledge list endpoint (<code style={codeStyle}>GET /api/knowledge/list</code>) provides the flat file listing.
          </p>

          <h3 style={h3Style}>Wikilink Detection</h3>
          <p style={pStyle}>
            The knowledge system automatically detects <code style={codeStyle}>[[wikilink]]</code> syntax in memory files. When a wikilink is found, the system attempts to resolve it against existing knowledge entries. Resolved links become navigable connections in the graph and clickable references in the editor. Unresolved links are highlighted as broken references.
          </p>

          <h3 style={h3Style}>Patterns and Corrections</h3>
          <p style={pStyle}>
            The Patterns screen (<code style={codeStyle}>/patterns</code>) manages reusable behavioral patterns and corrections:
          </p>
          <ul style={ulStyle}>
            <li><strong>Patterns:</strong> Reusable prompt templates that can be applied to sessions. Define common instructions, formatting rules, or behavioral guidelines.</li>
            <li><strong>Corrections:</strong> Specific behavioral fixes that override default agent behavior. When a correction is active, it is injected into the agent's system prompt to prevent repeat mistakes.</li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            8. SKILLS ECOSYSTEM
        ════════════════════════════════════════════════════════════════ */}
        <section id="skills-ecosystem" style={sectionStyle}>
          <h2 style={h2Style}>8. Skills Ecosystem</h2>

          <h3 style={h3Style}>Skill Registry</h3>
          <p style={pStyle}>
            Hermes Studio provides access to a registry of 2000+ skills available from skillsmp.com (the Hermes skill marketplace). Skills extend agent capabilities by providing structured instructions, tool definitions, and workflow patterns. The skills screen displays installed skills with their status (enabled/disabled) and available skills from the hub.
          </p>

          <h3 style={h3Style}>Installation Flow</h3>
          <p style={pStyle}>
            Skill installation follows a two-tier strategy:
          </p>
          <ol style={olStyle}>
            <li><strong>Gateway installation:</strong> The primary path sends an install request to the Hermes Gateway via <code style={codeStyle}>POST /api/skills/install</code>. The gateway downloads the skill from the registry and places it in the skills directory.</li>
            <li><strong>ClawHub fallback:</strong> If gateway installation fails (older gateway version, network issues), the system falls back to the ClawHub API for skill retrieval.</li>
          </ol>
          <p style={pStyle}>
            Uninstallation is performed via <code style={codeStyle}>POST /api/skills/uninstall</code> which removes the skill files from the gateway's skill directory.
          </p>

          <h3 style={h3Style}>Enable/Disable Toggle</h3>
          <p style={pStyle}>
            Installed skills can be enabled or disabled without uninstalling. Disabled skills remain on disk but are excluded from the agent's active skill set. This allows quick experimentation without reinstallation overhead. Skill settings are managed via <code style={codeStyle}>POST /api/skills/settings</code>.
          </p>

          <h3 style={h3Style}>Skill Documentation</h3>
          <p style={pStyle}>
            Each skill includes a SKILL.md documentation file describing its capabilities, usage patterns, and configuration options. The skills screen renders this documentation inline when a skill is selected. Hub search (<code style={codeStyle}>GET /api/skills/hub-search</code>) returns skill metadata including name, description, category, and installation count.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            9. AGENT LIBRARY
        ════════════════════════════════════════════════════════════════ */}
        <section id="agent-library" style={sectionStyle}>
          <h2 style={h2Style}>9. Agent Library</h2>

          <h3 style={h3Style}>Built-in Personas</h3>
          <p style={pStyle}>
            Hermes Studio ships with 8 built-in agent personas, each specialized for different task types:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Emoji</th>
                <th style={thStyle}>Specialties</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Roger</td><td style={tdStyle}>Frontend Developer</td><td style={tdStyle}>🎨</td><td style={tdStyle}>React, CSS, Tailwind, UI/UX, components, layout, design</td></tr>
              <tr><td style={tdStyle}>Sally</td><td style={tdStyle}>Backend Architect</td><td style={tdStyle}>🏗️</td><td style={tdStyle}>API, server, database, Node, Express, routes, schemas</td></tr>
              <tr><td style={tdStyle}>Bill</td><td style={tdStyle}>Marketing Expert</td><td style={tdStyle}>📣</td><td style={tdStyle}>Marketing, SEO, content, copy, brand, social, campaigns</td></tr>
              <tr><td style={tdStyle}>Ada</td><td style={tdStyle}>QA Engineer</td><td style={tdStyle}>🔍</td><td style={tdStyle}>Testing, QA, bugs, debugging, linting, TypeScript, validation</td></tr>
              <tr><td style={tdStyle}>Max</td><td style={tdStyle}>DevOps Specialist</td><td style={tdStyle}>⚙️</td><td style={tdStyle}>Deploy, Docker, CI/CD, build, infrastructure, monitoring</td></tr>
              <tr><td style={tdStyle}>Luna</td><td style={tdStyle}>Research Analyst</td><td style={tdStyle}>🔬</td><td style={tdStyle}>Research, analysis, comparison, reports, data, strategy</td></tr>
              <tr><td style={tdStyle}>Kai</td><td style={tdStyle}>Full-Stack Engineer</td><td style={tdStyle}>⚡</td><td style={tdStyle}>Full-stack, features, implementation, scaffolding, refactoring</td></tr>
              <tr><td style={tdStyle}>Nova</td><td style={tdStyle}>Security Specialist</td><td style={tdStyle}>🛡️</td><td style={tdStyle}>Security, auth, permissions, encryption, vulnerability scanning</td></tr>
            </tbody>
          </table>
          <p style={pStyle}>
            Personas are assigned to crew members round-robin or by matching task keywords against specialty tags.
          </p>

          <h3 style={h3Style}>Custom Agent Creation</h3>
          <p style={pStyle}>
            The agent editor dialog allows creating custom agents with the following properties:
          </p>
          <ul style={ulStyle}>
            <li><strong>Name:</strong> Display name for the agent.</li>
            <li><strong>Emoji:</strong> Visual avatar emoji shown in UI elements.</li>
            <li><strong>Color:</strong> Accent color for the agent's visual identity.</li>
            <li><strong>System Prompt:</strong> Custom system instructions defining the agent's behavior, knowledge, and communication style.</li>
            <li><strong>Model Override:</strong> Optionally lock this agent to a specific LLM model regardless of global settings.</li>
            <li><strong>Tags:</strong> Specialty tags used for automatic persona matching in crews and conductor.</li>
          </ul>
          <p style={pStyle}>
            Custom agents are managed via <code style={codeStyle}>POST /api/agents</code> (create), <code style={codeStyle}>PUT /api/agents/:agentId</code> (update), and <code style={codeStyle}>DELETE /api/agents/:agentId</code> (delete). They are stored in a file-backed definitions store.
          </p>

          <h3 style={h3Style}>Integration with Crews and Templates</h3>
          <p style={pStyle}>
            Both built-in and custom agents appear in the crew member selection UI. When creating a crew from a template, the template specifies agent assignments by name or specialty match. Custom agents can be used in templates and will be resolved at dispatch time.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            10. FILE MANAGEMENT & TERMINAL
        ════════════════════════════════════════════════════════════════ */}
        <section id="files-terminal" style={sectionStyle}>
          <h2 style={h2Style}>10. File Management &amp; Terminal</h2>

          <h3 style={h3Style}>Profile-Scoped File Browser</h3>
          <p style={pStyle}>
            The file browser operates within the active profile's workspace scope. It provides:
          </p>
          <ul style={ulStyle}>
            <li>Tree-style directory navigation with expandable folders.</li>
            <li>File metadata display (size, modification time, type).</li>
            <li>Create, rename, and delete operations for files and directories.</li>
            <li>File content is served via <code style={codeStyle}>GET /api/files?path=...</code> and saved via <code style={codeStyle}>POST /api/files</code>.</li>
          </ul>

          <h3 style={h3Style}>Monaco Editor Integration</h3>
          <p style={pStyle}>
            File editing uses the Monaco editor (the same editor powering VS Code). Configuration options:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>Syntax Highlighting</dt>
            <dd style={ddStyle}>Automatic language detection based on file extension. Supports TypeScript, JavaScript, Python, Rust, Go, Markdown, JSON, YAML, HTML, CSS, and 50+ other languages.</dd>
            <dt style={dtStyle}>Font Size</dt>
            <dd style={ddStyle}>Configurable via Settings (default: 13px). Stored in <code style={codeStyle}>editorFontSize</code> setting.</dd>
            <dt style={dtStyle}>Word Wrap</dt>
            <dd style={ddStyle}>Toggle word wrapping for long lines. Stored in <code style={codeStyle}>editorWordWrap</code> setting.</dd>
            <dt style={dtStyle}>Minimap</dt>
            <dd style={ddStyle}>Optional code minimap in the right gutter. Stored in <code style={codeStyle}>editorMinimap</code> setting.</dd>
          </dl>

          <h3 style={h3Style}>PTY Terminal</h3>
          <p style={pStyle}>
            The terminal screen provides a full PTY (pseudo-terminal) powered by Xterm.js:
          </p>
          <ul style={ulStyle}>
            <li><strong>Persistent sessions:</strong> Terminal sessions survive page refreshes. The PTY process continues running on the server.</li>
            <li><strong>Streaming:</strong> Terminal I/O is streamed via <code style={codeStyle}>GET /api/terminal-stream</code> (SSE for output) and <code style={codeStyle}>POST /api/terminal-input</code> (keystrokes).</li>
            <li><strong>Resize:</strong> Terminal dimensions are synchronized via <code style={codeStyle}>POST /api/terminal-resize</code> when the browser window or panel changes size.</li>
            <li><strong>Close:</strong> Explicitly close a terminal session via <code style={codeStyle}>POST /api/terminal-close</code>.</li>
            <li><strong>ANSI support:</strong> Full 256-color and true-color ANSI rendering, bold, italic, underline, and cursor positioning.</li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            11. ANALYTICS & OBSERVABILITY
        ════════════════════════════════════════════════════════════════ */}
        <section id="analytics-observability" style={sectionStyle}>
          <h2 style={h2Style}>11. Analytics &amp; Observability</h2>

          <h3 style={h3Style}>Event Analytics</h3>
          <p style={pStyle}>
            The analytics screen (<code style={codeStyle}>/analytics</code>) provides visual insights into agent activity:
          </p>
          <ul style={ulStyle}>
            <li><strong>14-day stacked bar chart:</strong> Shows daily event counts broken down by type (messages, tool calls, approvals, errors). Data sourced from <code style={codeStyle}>GET /api/state-analytics</code>.</li>
            <li><strong>Tool frequency:</strong> Ranked list of most-used tools with invocation counts and success rates.</li>
            <li><strong>Context usage:</strong> Time-series chart showing context window utilization over time via <code style={codeStyle}>GET /api/context-usage</code>.</li>
            <li><strong>Provider usage:</strong> Breakdown of token consumption by LLM provider via <code style={codeStyle}>GET /api/provider-usage</code>.</li>
          </ul>

          <h3 style={h3Style}>Session History</h3>
          <p style={pStyle}>
            The session history screen (<code style={codeStyle}>/session-history</code>) provides a two-pane archive interface:
          </p>
          <ul style={ulStyle}>
            <li><strong>Left pane:</strong> Scrollable session list showing session name, creation date, message count, and last activity. Sorted by most recent activity.</li>
            <li><strong>Right pane:</strong> Lazy-loaded message thread for the selected session. Messages render with full formatting including code blocks, tool results, and approval receipts.</li>
            <li><strong>Data source:</strong> <code style={codeStyle}>GET /api/history</code> returns archived session metadata. Individual session messages are loaded on selection.</li>
          </ul>

          <h3 style={h3Style}>Audit Trail</h3>
          <p style={pStyle}>
            The audit trail (<code style={codeStyle}>/audit</code>) maintains a chronological log of all significant system events:
          </p>
          <ul style={ulStyle}>
            <li><strong>Event types:</strong> Session created/deleted, message sent, tool executed, approval granted/denied, configuration changed, skill installed/removed, job created/run.</li>
            <li><strong>Filtering:</strong> Filter by event type, session key, date range, or free-text search.</li>
            <li><strong>Data source:</strong> <code style={codeStyle}>GET /api/audit</code> with query parameters for pagination and filtering.</li>
            <li><strong>Retention:</strong> Audit entries are persisted on the gateway and retained indefinitely unless manually purged.</li>
          </ul>

          <h3 style={h3Style}>Logs Viewer</h3>
          <p style={pStyle}>
            The logs screen (<code style={codeStyle}>/logs</code>) displays the last 500 lines of gateway system logs:
          </p>
          <ul style={ulStyle}>
            <li><strong>Color coding:</strong> Log levels are color-coded — debug (gray), info (blue), warn (amber), error (red).</li>
            <li><strong>Auto-scroll:</strong> New log lines automatically scroll the view to the bottom. A pause button stops auto-scroll for manual inspection.</li>
            <li><strong>Timestamps:</strong> Each line shows the timestamp in local time format.</li>
            <li><strong>Source:</strong> Logs are fetched from the gateway and displayed in a monospace terminal-style container.</li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            12. API REFERENCE
        ════════════════════════════════════════════════════════════════ */}
        <section id="api-reference" style={sectionStyle}>
          <h2 style={h2Style}>12. API Reference</h2>
          <p style={pStyle}>
            All API endpoints are served by the Hermes Studio server process and proxy to the Hermes Gateway where appropriate. Base path: <code style={codeStyle}>/api</code>. All mutating endpoints require <code style={codeStyle}>Content-Type: application/json</code>. Authentication is via session cookie or Bearer token.
          </p>

          <h3 style={h3Style}>Authentication</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/auth-check</td><td style={tdStyle}>Check if the current session is authenticated. Returns 200 with user info or 401.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/auth</td><td style={tdStyle}>Authenticate with password. Returns session token on success.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/oauth/device-code</td><td style={tdStyle}>Initiate OAuth device code flow. Returns device code and user verification URL.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/oauth/poll-token</td><td style={tdStyle}>Poll for OAuth token completion after device code authorization.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Sessions</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/sessions</td><td style={tdStyle}>List all active sessions with metadata (name, status, created timestamp).</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/sessions</td><td style={tdStyle}>Create a new session. Body: optional name, model, system prompt.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/sessions/:sessionKey/status</td><td style={tdStyle}>Get current session status (idle, active, waiting_for_input).</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/sessions/:sessionKey/active-run</td><td style={tdStyle}>Get the currently active run for a session, if any.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/sessions/send</td><td style={tdStyle}>Send a message to a session. Body: sessionKey, message, attachments.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/session-status</td><td style={tdStyle}>Batch status check for multiple sessions.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/chat-events</td><td style={tdStyle}>SSE stream of chat events for a session. Query: sessionKey.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/events</td><td style={tdStyle}>SSE stream of global system events.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/events/replay</td><td style={tdStyle}>Replay historical events for a session from a given timestamp.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/send</td><td style={tdStyle}>Alternative send endpoint for portable chat completions mode.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/send-stream</td><td style={tdStyle}>SSE stream for portable chat completions mode.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/history</td><td style={tdStyle}>Get archived session history (past sessions with message counts).</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Crews</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/crews</td><td style={tdStyle}>List all crews with member counts and status.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/crews</td><td style={tdStyle}>Create a new crew. Body: name, description, members array.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/crews/:crewId</td><td style={tdStyle}>Get crew details including members, workflow, and dispatch history.</td></tr>
              <tr><td style={tdCodeStyle}>PUT</td><td style={tdCodeStyle}>/api/crews/:crewId</td><td style={tdStyle}>Update crew configuration (name, description, members).</td></tr>
              <tr><td style={tdCodeStyle}>DELETE</td><td style={tdCodeStyle}>/api/crews/:crewId</td><td style={tdStyle}>Delete a crew and optionally its associated sessions.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/crews/:crewId/dispatch</td><td style={tdStyle}>Dispatch a mission to the crew. Body: goal, strategy.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/crews/:crewId/clone</td><td style={tdStyle}>Clone crew with fresh sessions for all members.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/crews/:crewId/workflow</td><td style={tdStyle}>Get the crew's workflow DAG definition.</td></tr>
              <tr><td style={tdCodeStyle}>PUT</td><td style={tdCodeStyle}>/api/crews/:crewId/workflow</td><td style={tdStyle}>Update the crew's workflow DAG (nodes and edges).</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/crews/:crewId/usage</td><td style={tdStyle}>Get token usage breakdown per crew member.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/crews/templates</td><td style={tdStyle}>List all available crew templates (built-in + custom).</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/crews/templates</td><td style={tdStyle}>Create a custom crew template.</td></tr>
              <tr><td style={tdCodeStyle}>DELETE</td><td style={tdCodeStyle}>/api/crews/templates/:id</td><td style={tdStyle}>Delete a user-created template (built-in templates cannot be deleted).</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Conductor</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/conductor-spawn</td><td style={tdStyle}>Spawn a conductor mission. Body: goal, orchestratorModel, workerModel, projectsDir, maxParallel, supervised.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/conductor-stop</td><td style={tdStyle}>Stop a running conductor mission. Terminates all worker sessions.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Tasks</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/tasks</td><td style={tdStyle}>List all tasks across all columns.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/tasks</td><td style={tdStyle}>Create a new task. Body: title, description, priority, tags, column, assignee, sourceLinks.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/tasks/:taskId</td><td style={tdStyle}>Get a single task by ID.</td></tr>
              <tr><td style={tdCodeStyle}>PUT</td><td style={tdCodeStyle}>/api/tasks/:taskId</td><td style={tdStyle}>Update task properties.</td></tr>
              <tr><td style={tdCodeStyle}>DELETE</td><td style={tdCodeStyle}>/api/tasks/:taskId</td><td style={tdStyle}>Delete a task.</td></tr>
              <tr><td style={tdCodeStyle}>PATCH</td><td style={tdCodeStyle}>/api/tasks/:taskId/move</td><td style={tdStyle}>Move a task to a different column. Body: column, position.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Agents</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/agents</td><td style={tdStyle}>List all custom agent definitions.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/agents</td><td style={tdStyle}>Create a new agent. Body: name, emoji, color, systemPrompt, model, tags.</td></tr>
              <tr><td style={tdCodeStyle}>PUT</td><td style={tdCodeStyle}>/api/agents/:agentId</td><td style={tdStyle}>Update an existing agent definition.</td></tr>
              <tr><td style={tdCodeStyle}>DELETE</td><td style={tdCodeStyle}>/api/agents/:agentId</td><td style={tdStyle}>Delete a custom agent.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Jobs (Cron)</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/hermes-jobs</td><td style={tdStyle}>List all registered cron jobs with status and schedule info.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/hermes-jobs</td><td style={tdStyle}>Create a new cron job. Body: name, prompt, schedule, delivery config.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/hermes-jobs/:jobId</td><td style={tdStyle}>Get details of a specific job.</td></tr>
              <tr><td style={tdCodeStyle}>PUT</td><td style={tdCodeStyle}>/api/hermes-jobs/:jobId</td><td style={tdStyle}>Update job configuration (schedule, prompt, delivery).</td></tr>
              <tr><td style={tdCodeStyle}>DELETE</td><td style={tdCodeStyle}>/api/hermes-jobs/:jobId</td><td style={tdStyle}>Delete a cron job.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/hermes-runs</td><td style={tdStyle}>List recent job runs with status and timing.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/hermes-runs/:runId/events</td><td style={tdStyle}>SSE stream of events for a specific job run.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Memory &amp; Knowledge</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/memory</td><td style={tdStyle}>Get memory overview (file list with metadata).</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/memory/list</td><td style={tdStyle}>List all memory files with paths and sizes.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/memory/read</td><td style={tdStyle}>Read a specific memory file. Query: path.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/memory/write</td><td style={tdStyle}>Write content to a memory file. Body: path, content.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/memory/search</td><td style={tdStyle}>Full-text search across memory files. Query: q.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/knowledge/list</td><td style={tdStyle}>List all knowledge entries.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/knowledge/read</td><td style={tdStyle}>Read a knowledge entry. Query: path.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/knowledge/search</td><td style={tdStyle}>Search knowledge base. Query: q.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/knowledge/graph</td><td style={tdStyle}>Get knowledge graph (nodes and edges JSON for visualization).</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Skills</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/skills</td><td style={tdStyle}>List installed skills with enabled/disabled status.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/skills/install</td><td style={tdStyle}>Install a skill from the registry. Body: skillId.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/skills/uninstall</td><td style={tdStyle}>Uninstall a skill. Body: skillId.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/skills/settings</td><td style={tdStyle}>Update skill settings (enable/disable). Body: skillId, enabled.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/skills/hub-search</td><td style={tdStyle}>Search the skill marketplace. Query: q, category.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Files</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/files</td><td style={tdStyle}>List files or read file content. Query: path, action (list/read).</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/files</td><td style={tdStyle}>Create or update a file. Body: path, content.</td></tr>
              <tr><td style={tdCodeStyle}>DELETE</td><td style={tdCodeStyle}>/api/files</td><td style={tdStyle}>Delete a file. Body: path.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/paths</td><td style={tdStyle}>Get workspace path information for the active profile.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Profiles</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/profiles/list</td><td style={tdStyle}>List all available profiles with active indicator.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/profiles/create</td><td style={tdStyle}>Create a new profile. Body: name.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/profiles/activate</td><td style={tdStyle}>Switch the active profile. Body: name.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/profiles/rename</td><td style={tdStyle}>Rename a profile. Body: oldName, newName.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/profiles/delete</td><td style={tdStyle}>Delete a profile. Body: name.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/profiles/read</td><td style={tdStyle}>Read profile-specific configuration.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Configuration</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/hermes-config</td><td style={tdStyle}>Get current gateway configuration.</td></tr>
              <tr><td style={tdCodeStyle}>PATCH</td><td style={tdCodeStyle}>/api/hermes-config</td><td style={tdStyle}>Update gateway configuration. Body: partial config object.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/mcp/servers</td><td style={tdStyle}>List configured MCP servers.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/mcp/servers</td><td style={tdStyle}>Add or update an MCP server configuration.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/mcp/reload</td><td style={tdStyle}>Reload MCP server connections.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Analytics</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/state-analytics</td><td style={tdStyle}>Get event analytics data (14-day breakdown by event type).</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/context-usage</td><td style={tdStyle}>Get context window usage time series data.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/provider-usage</td><td style={tdStyle}>Get token usage breakdown by LLM provider.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>System</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/ping</td><td style={tdStyle}>Health check. Returns 200 with timestamp.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/system-health</td><td style={tdStyle}>Detailed system health including gateway connectivity, Redis status, and uptime.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/systemd-status</td><td style={tdStyle}>Get systemd service status for the Hermes gateway process.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/systemd-control</td><td style={tdStyle}>Control the Hermes gateway systemd service (start, stop, restart).</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/models</td><td style={tdStyle}>List available LLM models from the gateway.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/workspace</td><td style={tdStyle}>Get workspace information (path, profile, gateway version).</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/gateway-status</td><td style={tdStyle}>Get gateway connection status and detected capabilities.</td></tr>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/connection-status</td><td style={tdStyle}>Lightweight connection check (faster than full health).</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/start-hermes</td><td style={tdStyle}>Start the Hermes gateway process if not running.</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/start-agent</td><td style={tdStyle}>Start an agent session with specific configuration.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Operations</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/operations</td><td style={tdStyle}>Get operational overview of all active agent sessions with status and metrics.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Approvals</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/approvals/:approvalId/approve</td><td style={tdStyle}>Approve a pending action. Body: scope (once, session, always).</td></tr>
              <tr><td style={tdCodeStyle}>POST</td><td style={tdCodeStyle}>/api/approvals/:approvalId/deny</td><td style={tdStyle}>Deny a pending action.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Audit</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>GET</td><td style={tdCodeStyle}>/api/audit</td><td style={tdStyle}>Get audit trail entries. Query: type, session, from, to, limit, offset.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Gateway Proxy</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Method</th><th style={thStyle}>Path</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>ANY</td><td style={tdCodeStyle}>/api/hermes-proxy/*</td><td style={tdStyle}>Transparent proxy to the Hermes Gateway. Forwards any request path and method. Used for direct gateway access from custom integrations.</td></tr>
            </tbody>
          </table>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            13. CONFIGURATION REFERENCE
        ════════════════════════════════════════════════════════════════ */}
        <section id="configuration" style={sectionStyle}>
          <h2 style={h2Style}>13. Configuration Reference</h2>

          <h3 style={h3Style}>localStorage Settings (Zustand Store)</h3>
          <p style={pStyle}>
            Client-side settings are managed by a Zustand store with localStorage persistence. The store key is <code style={codeStyle}>hermes-studio-settings</code>.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Key</th><th style={thStyle}>Type</th><th style={thStyle}>Default</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>hermesUrl</td><td style={tdStyle}>string</td><td style={tdCodeStyle}>""</td><td style={tdStyle}>Gateway server URL (e.g., http://localhost:8642)</td></tr>
              <tr><td style={tdCodeStyle}>hermesToken</td><td style={tdStyle}>string</td><td style={tdCodeStyle}>""</td><td style={tdStyle}>Bearer token for gateway authentication</td></tr>
              <tr><td style={tdCodeStyle}>hermesApiKey</td><td style={tdStyle}>string</td><td style={tdCodeStyle}>""</td><td style={tdStyle}>API server key for non-loopback Hermes instances</td></tr>
              <tr><td style={tdCodeStyle}>theme</td><td style={tdStyle}>"system" | "dark"</td><td style={tdCodeStyle}>"system"</td><td style={tdStyle}>Color scheme preference</td></tr>
              <tr><td style={tdCodeStyle}>accentColor</td><td style={tdStyle}>"orange" | "purple" | "blue" | "green"</td><td style={tdCodeStyle}>"blue"</td><td style={tdStyle}>UI accent color</td></tr>
              <tr><td style={tdCodeStyle}>editorFontSize</td><td style={tdStyle}>number</td><td style={tdCodeStyle}>13</td><td style={tdStyle}>Monaco editor font size in pixels</td></tr>
              <tr><td style={tdCodeStyle}>editorWordWrap</td><td style={tdStyle}>boolean</td><td style={tdCodeStyle}>true</td><td style={tdStyle}>Enable word wrapping in the editor</td></tr>
              <tr><td style={tdCodeStyle}>editorMinimap</td><td style={tdStyle}>boolean</td><td style={tdCodeStyle}>false</td><td style={tdStyle}>Show code minimap in editor gutter</td></tr>
              <tr><td style={tdCodeStyle}>notificationsEnabled</td><td style={tdStyle}>boolean</td><td style={tdCodeStyle}>true</td><td style={tdStyle}>Enable browser notifications</td></tr>
              <tr><td style={tdCodeStyle}>usageThreshold</td><td style={tdStyle}>number</td><td style={tdCodeStyle}>80</td><td style={tdStyle}>Context usage warning threshold (%)</td></tr>
              <tr><td style={tdCodeStyle}>smartSuggestionsEnabled</td><td style={tdStyle}>boolean</td><td style={tdCodeStyle}>false</td><td style={tdStyle}>Enable smart model suggestions based on task complexity</td></tr>
              <tr><td style={tdCodeStyle}>preferredBudgetModel</td><td style={tdStyle}>string</td><td style={tdCodeStyle}>""</td><td style={tdStyle}>Preferred model for cost-sensitive tasks</td></tr>
              <tr><td style={tdCodeStyle}>preferredPremiumModel</td><td style={tdStyle}>string</td><td style={tdCodeStyle}>""</td><td style={tdStyle}>Preferred model for complex/premium tasks</td></tr>
              <tr><td style={tdCodeStyle}>onlySuggestCheaper</td><td style={tdStyle}>boolean</td><td style={tdCodeStyle}>false</td><td style={tdStyle}>Only suggest cheaper model alternatives</td></tr>
              <tr><td style={tdCodeStyle}>showSystemMetricsFooter</td><td style={tdStyle}>boolean</td><td style={tdCodeStyle}>false</td><td style={tdStyle}>Show system metrics in the footer bar</td></tr>
              <tr><td style={tdCodeStyle}>mobileChatNavMode</td><td style={tdStyle}>"dock" | "integrated" | "scroll-hide"</td><td style={tdCodeStyle}>"dock"</td><td style={tdStyle}>Mobile navigation mode for chat screen</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Additional localStorage Keys</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Key</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>hermes-theme</td><td style={tdStyle}>Active visual theme ID (hermes-os, hermes-official, hermes-classic, hermes-slate, hermes-mono)</td></tr>
              <tr><td style={tdCodeStyle}>hermes-studio:office-layout</td><td style={tdStyle}>Conductor office view layout preference (grid, roundtable, warroom)</td></tr>
              <tr><td style={tdCodeStyle}>hermes-studio:conductor-settings</td><td style={tdStyle}>Conductor configuration (orchestrator model, worker model, projects dir, max parallel, supervised)</td></tr>
              <tr><td style={tdCodeStyle}>hermes-studio:mission-history</td><td style={tdStyle}>Array of completed conductor missions (max 50 entries)</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Gateway Configuration</h3>
          <p style={pStyle}>
            The Hermes Gateway is configured via <code style={codeStyle}>~/.hermes/config.yaml</code>. Studio reads and writes this configuration through the <code style={codeStyle}>/api/hermes-config</code> endpoint. Key configuration sections:
          </p>
          <pre style={preStyle}>{`# ~/.hermes/config.yaml
server:
  host: 0.0.0.0
  port: 8642
  cors_origins: ["*"]

auth:
  token: "your-bearer-token"
  password: "your-login-password"

providers:
  anthropic:
    api_key: "sk-ant-..."
    default_model: "claude-sonnet-4-20250514"
  openai:
    api_key: "sk-..."
    default_model: "gpt-4o"

sessions:
  persistence: redis  # or "file"
  redis_url: "redis://localhost:6379"
  max_sessions: 50

skills:
  directory: "~/.hermes/skills"
  auto_enable: true

memory:
  directory: "~/.hermes/memory"

jobs:
  directory: "~/.hermes/jobs"
  max_concurrent: 3`}</pre>

          <h3 style={h3Style}>Conductor Settings</h3>
          <p style={pStyle}>
            Conductor settings are stored in localStorage and passed to the spawn endpoint:
          </p>
          <pre style={preStyle}>{`{
  "orchestratorModel": "",       // Empty = gateway default
  "workerModel": "",             // Empty = gateway default
  "projectsDir": "/tmp",         // Output directory for workers
  "maxParallel": 3,              // 1-5 concurrent workers
  "supervised": false            // Require approvals for workers
}`}</pre>

          <h3 style={h3Style}>File-Backed Stores</h3>
          <p style={pStyle}>
            Several data stores use the <code style={codeStyle}>.runtime/</code> directory within the Hermes Studio installation:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>.runtime/crews.json</dt>
            <dd style={ddStyle}>Crew definitions and member configurations.</dd>
            <dt style={dtStyle}>.runtime/tasks.json</dt>
            <dd style={ddStyle}>Task board state (all tasks across all columns).</dd>
            <dt style={dtStyle}>.runtime/agents.json</dt>
            <dd style={ddStyle}>Custom agent definitions created via the agent editor.</dd>
            <dt style={dtStyle}>.runtime/templates/</dt>
            <dd style={ddStyle}>User-created crew templates (one JSON file per template).</dd>
          </dl>

          <h3 style={h3Style}>Environment Variables</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Variable</th><th style={thStyle}>Default</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>HERMES_API_URL</td><td style={tdCodeStyle}>http://127.0.0.1:8642</td><td style={tdStyle}>URL of the Hermes Gateway server. The Studio server connects here for all gateway operations.</td></tr>
              <tr><td style={tdCodeStyle}>HERMES_API_TOKEN</td><td style={tdStyle}>(none)</td><td style={tdStyle}>Bearer token for authenticating with the gateway. Sent as Authorization header on all proxy requests.</td></tr>
              <tr><td style={tdCodeStyle}>HERMES_PASSWORD</td><td style={tdStyle}>(none)</td><td style={tdStyle}>Password required to log into Hermes Studio. When set, the login screen is shown on first visit.</td></tr>
              <tr><td style={tdCodeStyle}>REDIS_URL</td><td style={tdStyle}>(none)</td><td style={tdStyle}>Redis connection URL for session token persistence. Example: redis://localhost:6379. When unset, tokens are stored in memory only.</td></tr>
              <tr><td style={tdCodeStyle}>NODE_ENV</td><td style={tdCodeStyle}>development</td><td style={tdStyle}>Environment mode. In production, error messages are sanitized and debug logging is suppressed.</td></tr>
              <tr><td style={tdCodeStyle}>PORT</td><td style={tdCodeStyle}>3000</td><td style={tdStyle}>Port number for the Hermes Studio server.</td></tr>
            </tbody>
          </table>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            14. DESIGN SYSTEM
        ════════════════════════════════════════════════════════════════ */}
        <section id="design-system" style={sectionStyle}>
          <h2 style={h2Style}>14. Design System</h2>

          <h3 style={h3Style}>Theme System</h3>
          <p style={pStyle}>
            Hermes Studio uses a CSS custom property theming system with 5 available themes. Themes are applied by setting the <code style={codeStyle}>data-theme</code> attribute on the document root. All themes operate in dark mode only.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Theme ID</th><th style={thStyle}>Label</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>hermes-os</td><td style={tdStyle}>Hermes OS</td><td style={tdStyle}>Electric blue cinematic agent OS theme. The default theme.</td></tr>
              <tr><td style={tdCodeStyle}>hermes-official</td><td style={tdStyle}>Hermes Official</td><td style={tdStyle}>Navy and indigo flagship theme with professional aesthetics.</td></tr>
              <tr><td style={tdCodeStyle}>hermes-classic</td><td style={tdStyle}>Hermes Classic</td><td style={tdStyle}>Bronze accents on dark charcoal for a warm, sophisticated look.</td></tr>
              <tr><td style={tdCodeStyle}>hermes-slate</td><td style={tdStyle}>Slate</td><td style={tdStyle}>Cool blue developer theme with subtle gradients.</td></tr>
              <tr><td style={tdCodeStyle}>hermes-mono</td><td style={tdStyle}>Mono</td><td style={tdStyle}>Clean monochrome grayscale for minimal distraction.</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>CSS Variable Tokens</h3>
          <p style={pStyle}>
            Every theme provides the following CSS custom properties. All UI components must use these variables rather than hard-coded colors:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Variable</th><th style={thStyle}>Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>--theme-bg</td><td style={tdStyle}>Primary background color for pages and screens</td></tr>
              <tr><td style={tdCodeStyle}>--theme-sidebar</td><td style={tdStyle}>Sidebar navigation background</td></tr>
              <tr><td style={tdCodeStyle}>--theme-panel</td><td style={tdStyle}>Panel/drawer background (slightly elevated)</td></tr>
              <tr><td style={tdCodeStyle}>--theme-card</td><td style={tdStyle}>Card component background (first level)</td></tr>
              <tr><td style={tdCodeStyle}>--theme-card2</td><td style={tdStyle}>Card component background (second level, nested)</td></tr>
              <tr><td style={tdCodeStyle}>--theme-border</td><td style={tdStyle}>Primary border color for cards, inputs, dividers</td></tr>
              <tr><td style={tdCodeStyle}>--theme-border-subtle</td><td style={tdStyle}>Subtle border for low-emphasis separators</td></tr>
              <tr><td style={tdCodeStyle}>--theme-text</td><td style={tdStyle}>Primary text color (headings, labels, body)</td></tr>
              <tr><td style={tdCodeStyle}>--theme-muted</td><td style={tdStyle}>Secondary text color (descriptions, metadata)</td></tr>
              <tr><td style={tdCodeStyle}>--theme-accent</td><td style={tdStyle}>Accent color for interactive elements, links, badges</td></tr>
              <tr><td style={tdCodeStyle}>--theme-accent-subtle</td><td style={tdStyle}>Light accent background for highlight regions</td></tr>
              <tr><td style={tdCodeStyle}>--theme-accent-border</td><td style={tdStyle}>Border color for accent-highlighted containers</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Accent Colors</h3>
          <p style={pStyle}>
            The UI accent color is configurable separately from the theme. Four accent options are available: orange, purple, blue, and green. The accent color affects interactive elements, links, selected states, badges, and focus rings throughout the application.
          </p>

          <h3 style={h3Style}>Component Library</h3>
          <p style={pStyle}>
            Hermes Studio uses a design system component library for consistent UI patterns:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>Card</dt>
            <dd style={ddStyle}>Container component with themed background, border, and border-radius. Supports header slots, padding variants, and hover states.</dd>
            <dt style={dtStyle}>SettingsRow</dt>
            <dd style={ddStyle}>Horizontal layout for settings with label on the left and control on the right. Used throughout the Settings screen.</dd>
            <dt style={dtStyle}>SectionHeader</dt>
            <dd style={ddStyle}>Section title component with optional subtitle and action button slot. Provides consistent spacing and typography.</dd>
            <dt style={dtStyle}>StatusBadge</dt>
            <dd style={ddStyle}>Small pill-shaped badge for displaying status (active, idle, error, complete). Color-coded by status type.</dd>
            <dt style={dtStyle}>ListItem</dt>
            <dd style={ddStyle}>Clickable list row with optional icon, title, description, and trailing element. Used in sidebars and selection lists.</dd>
            <dt style={dtStyle}>EmptyState</dt>
            <dd style={ddStyle}>Placeholder component shown when a list or view has no content. Includes icon, title, description, and optional action button.</dd>
          </dl>

          <h3 style={h3Style}>Icon Library</h3>
          <p style={pStyle}>
            Hermes Studio uses <strong>HugeIcons</strong> (<code style={codeStyle}>@hugeicons/react</code> with <code style={codeStyle}>@hugeicons/core-free-icons</code>) as its primary icon library. Icons are imported individually by name and rendered via the <code style={codeStyle}>HugeiconsIcon</code> component. The icon set provides consistent 24px stroke icons with adjustable size and color props.
          </p>

          <h3 style={h3Style}>Typography and Spacing</h3>
          <p style={pStyle}>
            The application loads four font families:
          </p>
          <ul style={ulStyle}>
            <li><strong>Inter</strong> (400-700): Primary UI font for all interface text.</li>
            <li><strong>Space Grotesk</strong> (400-700): Used for headings and display text.</li>
            <li><strong>JetBrains Mono</strong> (400-500): Monospace font for code, terminal, and technical content.</li>
            <li><strong>EB Garamond</strong> (400-800): Serif font available for editorial/creative content contexts.</li>
          </ul>
          <p style={pStyle}>
            Spacing follows Tailwind CSS conventions (4px base unit). Common spacing values: p-2 (8px), p-3 (12px), p-4 (16px), p-6 (24px), gap-2 (8px), gap-4 (16px). Border radius uses rounded-lg (8px) for cards and rounded-xl (12px) for larger containers.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            15. GATEWAY INTEGRATION
        ════════════════════════════════════════════════════════════════ */}
        <section id="gateway-integration" style={sectionStyle}>
          <h2 style={h2Style}>15. Gateway Integration</h2>

          <h3 style={h3Style}>Capability Probing</h3>
          <p style={pStyle}>
            On server startup and periodically every 120 seconds, Hermes Studio probes the configured gateway to determine available API groups. The probing process:
          </p>
          <ol style={olStyle}>
            <li>Send a GET request to the gateway health endpoint with a 3-second timeout.</li>
            <li>If health responds, probe core capabilities: chat completions, models, streaming support.</li>
            <li>If core capabilities are confirmed, probe enhanced capabilities: sessions, skills, memory, config, jobs.</li>
            <li>Cache results with a 120-second TTL. Subsequent requests use cached capabilities without re-probing.</li>
            <li>If probing fails (timeout, network error), all capabilities are marked as unavailable.</li>
          </ol>

          <h3 style={h3Style}>Enhanced vs Basic Mode</h3>
          <p style={pStyle}>
            Based on probing results, Studio operates in one of three chat modes:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>enhanced-hermes</dt>
            <dd style={ddStyle}>Full Hermes gateway with session management, tools, approvals, memory, and skills. All features are available.</dd>
            <dt style={dtStyle}>portable</dt>
            <dd style={ddStyle}>Basic OpenAI-compatible chat completions. Only streaming chat is available. No sessions, tools, or approvals.</dd>
            <dt style={dtStyle}>disconnected</dt>
            <dd style={ddStyle}>No gateway connectivity. The UI shows connection error state with retry options.</dd>
          </dl>

          <h3 style={h3Style}>Fallback Behavior</h3>
          <p style={pStyle}>
            When enhanced capabilities are unavailable, Studio degrades gracefully:
          </p>
          <ul style={ulStyle}>
            <li>Chat falls back to portable mode using <code style={codeStyle}>/api/send</code> and <code style={codeStyle}>/api/send-stream</code> for direct completions.</li>
            <li>Crews, Conductor, Jobs, Skills, Memory, and Files screens show connection-required empty states.</li>
            <li>The sidebar badges indicate which features require enhanced connectivity.</li>
            <li>Settings remain fully functional (stored locally) regardless of connection status.</li>
          </ul>

          <h3 style={h3Style}>Session Persistence Backends</h3>
          <p style={pStyle}>
            The Hermes Gateway supports two persistence backends for session data:
          </p>
          <dl style={dlStyle}>
            <dt style={dtStyle}>Redis</dt>
            <dd style={ddStyle}>Recommended for production. Messages stored in sorted sets, session metadata in hashes. Supports TTL expiration, atomic operations, and multi-process access. Requires <code style={codeStyle}>REDIS_URL</code> environment variable.</dd>
            <dt style={dtStyle}>File</dt>
            <dd style={ddStyle}>Fallback for development or single-user setups. Session data stored as JSON files in <code style={codeStyle}>.runtime/sessions/</code>. Simpler to deploy but lacks TTL management and concurrent access safety.</dd>
          </dl>

          <h3 style={h3Style}>Bearer Token Authentication</h3>
          <p style={pStyle}>
            The Studio server authenticates with the gateway using a Bearer token. The token is configured via:
          </p>
          <ol style={olStyle}>
            <li><strong>Environment variable:</strong> <code style={codeStyle}>HERMES_API_TOKEN</code> (highest priority)</li>
            <li><strong>Client setting:</strong> <code style={codeStyle}>hermesToken</code> in the Zustand settings store</li>
            <li><strong>Gateway config:</strong> The <code style={codeStyle}>auth.token</code> field in <code style={codeStyle}>~/.hermes/config.yaml</code></li>
          </ol>
          <p style={pStyle}>
            The token is sent as <code style={codeStyle}>Authorization: Bearer &lt;token&gt;</code> on all requests from the Studio server to the gateway. If no token is configured, requests are sent without authentication (suitable for localhost-only deployments).
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            16. SECURITY
        ════════════════════════════════════════════════════════════════ */}
        <section id="security" style={sectionStyle}>
          <h2 style={h2Style}>16. Security</h2>

          <h3 style={h3Style}>Authentication Strategies</h3>
          <p style={pStyle}>
            Hermes Studio supports multiple authentication methods:
          </p>
          <ul style={ulStyle}>
            <li><strong>Password authentication:</strong> When <code style={codeStyle}>HERMES_PASSWORD</code> is set, users must authenticate via a login form. On success, a 32-byte cryptographically random session token is generated and stored.</li>
            <li><strong>OAuth device code flow:</strong> For integrations with external identity providers. Initiates via <code style={codeStyle}>/api/oauth/device-code</code> and polls for completion via <code style={codeStyle}>/api/oauth/poll-token</code>.</li>
            <li><strong>API key authentication:</strong> The <code style={codeStyle}>hermesApiKey</code> setting supports non-loopback deployments where an API server key is required for access.</li>
            <li><strong>No authentication:</strong> When no password or token is configured, Studio allows unauthenticated access. Suitable only for localhost development.</li>
          </ul>

          <h3 style={h3Style}>Session Token Management</h3>
          <p style={pStyle}>
            Session tokens are 64-character hex strings generated from 32 bytes of <code style={codeStyle}>crypto.randomBytes</code>. Tokens are validated using timing-safe comparison to prevent timing attacks. Token storage:
          </p>
          <ul style={ulStyle}>
            <li>In-memory Set for fast validation (source of truth for the running process).</li>
            <li>Redis SET (<code style={codeStyle}>hermes:studio:tokens</code>) for persistence across restarts, with 30-day TTL.</li>
            <li>On startup, persisted tokens are loaded from Redis into the in-memory set.</li>
          </ul>

          <h3 style={h3Style}>CSRF Protection</h3>
          <p style={pStyle}>
            All mutating endpoints (POST, PUT, PATCH, DELETE) are protected by the <code style={codeStyle}>requireJsonContentType</code> middleware. This function rejects requests that do not include <code style={codeStyle}>Content-Type: application/json</code>. Since browsers cannot set this header on simple form submissions or navigation requests, its presence proves the request originated from JavaScript (fetch/XHR), effectively preventing CSRF attacks without requiring tokens.
          </p>
          <p style={pStyle}>
            Requests failing this check receive a <code style={codeStyle}>415 Unsupported Media Type</code> response with the message "Content-Type must be application/json".
          </p>

          <h3 style={h3Style}>Path Traversal Prevention</h3>
          <p style={pStyle}>
            File access endpoints (<code style={codeStyle}>/api/files</code>, <code style={codeStyle}>/api/memory/read</code>, <code style={codeStyle}>/api/memory/write</code>) validate and sanitize all path parameters to prevent directory traversal attacks. Paths are resolved against the workspace root and rejected if they attempt to escape the allowed directory tree using <code style={codeStyle}>..</code> sequences or absolute paths outside the scope.
          </p>

          <h3 style={h3Style}>Rate Limiting</h3>
          <p style={pStyle}>
            A sliding-window in-memory rate limiter protects sensitive endpoints:
          </p>
          <ul style={ulStyle}>
            <li>Rate limiting is applied per client IP (extracted from <code style={codeStyle}>X-Forwarded-For</code> header or defaulting to "local").</li>
            <li>The sliding window tracks request timestamps and removes entries outside the window period.</li>
            <li>When a client exceeds the limit, a <code style={codeStyle}>429 Too Many Requests</code> response is returned.</li>
            <li>Old entries are garbage-collected every 5 minutes to prevent memory leaks.</li>
            <li>Authentication endpoints use stricter limits to prevent brute-force attacks.</li>
          </ul>

          <h3 style={h3Style}>Content-Security-Policy</h3>
          <p style={pStyle}>
            The application sets appropriate Content-Security-Policy headers to restrict resource loading:
          </p>
          <ul style={ulStyle}>
            <li>Scripts are restricted to same-origin with inline allowances for the build system.</li>
            <li>Styles allow same-origin and Google Fonts CDN for font loading.</li>
            <li>Connections are restricted to same-origin and the configured gateway URL.</li>
            <li>Images allow same-origin and data: URIs for base64-encoded content.</li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            17. KEYBOARD SHORTCUTS
        ════════════════════════════════════════════════════════════════ */}
        <section id="keyboard-shortcuts" style={sectionStyle}>
          <h2 style={h2Style}>17. Keyboard Shortcuts</h2>
          <p style={pStyle}>
            Hermes Studio provides keyboard shortcuts for fast navigation and common actions. Modifier keys: Ctrl on Windows/Linux, Cmd on macOS.
          </p>

          <h3 style={h3Style}>Global Navigation</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Shortcut</th><th style={thStyle}>Action</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>Ctrl + K</td><td style={tdStyle}>Open command palette / quick navigation</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + ,</td><td style={tdStyle}>Open Settings</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 1</td><td style={tdStyle}>Navigate to Dashboard</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 2</td><td style={tdStyle}>Navigate to Chat</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 3</td><td style={tdStyle}>Navigate to Crews</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 4</td><td style={tdStyle}>Navigate to Conductor</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 5</td><td style={tdStyle}>Navigate to Tasks</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 6</td><td style={tdStyle}>Navigate to Jobs</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 7</td><td style={tdStyle}>Navigate to Memory</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 8</td><td style={tdStyle}>Navigate to Skills</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + 9</td><td style={tdStyle}>Navigate to Agents</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + B</td><td style={tdStyle}>Toggle sidebar visibility</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Chat Screen</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Shortcut</th><th style={thStyle}>Action</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>Enter</td><td style={tdStyle}>Send message</td></tr>
              <tr><td style={tdCodeStyle}>Shift + Enter</td><td style={tdStyle}>New line in message (without sending)</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + N</td><td style={tdStyle}>Create new session</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + A</td><td style={tdStyle}>Approve pending action</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + D</td><td style={tdStyle}>Deny pending action</td></tr>
              <tr><td style={tdCodeStyle}>Escape</td><td style={tdStyle}>Cancel current streaming response / close overlay</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + /</td><td style={tdStyle}>Toggle inspector panel</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + L</td><td style={tdStyle}>Clear chat display (does not delete history)</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>File Editor</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Shortcut</th><th style={thStyle}>Action</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>Ctrl + S</td><td style={tdStyle}>Save current file</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + P</td><td style={tdStyle}>Quick file open (fuzzy search)</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + F</td><td style={tdStyle}>Search across files</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Z</td><td style={tdStyle}>Undo</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + Z</td><td style={tdStyle}>Redo</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + G</td><td style={tdStyle}>Go to line number</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Tasks Board</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Shortcut</th><th style={thStyle}>Action</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + N</td><td style={tdStyle}>Create new task</td></tr>
              <tr><td style={tdCodeStyle}>Escape</td><td style={tdStyle}>Close task dialog</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Enter</td><td style={tdStyle}>Save task (when dialog is open)</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Conductor</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Shortcut</th><th style={thStyle}>Action</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>Ctrl + Enter</td><td style={tdStyle}>Submit mission goal</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + S</td><td style={tdStyle}>Open conductor settings</td></tr>
              <tr><td style={tdCodeStyle}>Escape</td><td style={tdStyle}>Close settings drawer</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Terminal</h3>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Shortcut</th><th style={thStyle}>Action</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + C</td><td style={tdStyle}>Copy selected text from terminal</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + V</td><td style={tdStyle}>Paste into terminal</td></tr>
              <tr><td style={tdCodeStyle}>Ctrl + Shift + T</td><td style={tdStyle}>Open new terminal tab</td></tr>
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--theme-muted)', fontSize: '0.85rem' }}>
          <p>Hermes Studio Documentation v1.20.0</p>
          <p style={{ marginTop: '0.25rem' }}>Built with React 19, TanStack Router, TanStack Query, and Vite.</p>
        </div>
      </div>
    </div>
  )
}
