export function HelpScreen() {
  const sectionStyle = { borderBottom: '1px solid var(--theme-border-subtle)', paddingBottom: '2rem', marginBottom: '2rem' }
  const h2Style = { color: 'var(--theme-text)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', marginTop: '0.5rem' }
  const h3Style = { color: 'var(--theme-text)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }
  const pStyle = { color: 'var(--theme-muted)', lineHeight: 1.7, marginBottom: '0.75rem' }
  const ulStyle = { color: 'var(--theme-muted)', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '1rem' }
  const olStyle = { color: 'var(--theme-muted)', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '1rem' }
  const tipStyle = {
    background: 'var(--theme-accent-subtle)',
    border: '1px solid var(--theme-accent-border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    color: 'var(--theme-accent)',
    fontSize: '0.9rem',
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
  const kbdStyle = {
    background: 'var(--theme-card2)',
    border: '1px solid var(--theme-border)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: 'var(--theme-text)',
  }
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '1rem',
  }
  const thStyle = {
    textAlign: 'left' as const,
    padding: '0.5rem 1rem',
    borderBottom: '2px solid var(--theme-border)',
    color: 'var(--theme-text)',
    fontWeight: 600,
  }
  const tdStyle = {
    padding: '0.5rem 1rem',
    borderBottom: '1px solid var(--theme-border-subtle)',
    color: 'var(--theme-muted)',
  }
  const tocLinkStyle = {
    color: 'var(--theme-accent)',
    textDecoration: 'none',
    lineHeight: 2,
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: 'var(--theme-bg)' }}>
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 style={{ color: 'var(--theme-text)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Hermes Studio Help
        </h1>
        <p style={{ color: 'var(--theme-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          A comprehensive guide to every feature in Hermes Studio. Use the table of contents below to jump to any section.
        </p>

        {/* Table of Contents */}
        <nav style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '1.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--theme-text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Table of Contents</h2>
          <ol style={{ ...olStyle, columns: 2, columnGap: '2rem' }}>
            <li><a href="#getting-started" style={tocLinkStyle}>Getting Started</a></li>
            <li><a href="#chat" style={tocLinkStyle}>Chat</a></li>
            <li><a href="#crews" style={tocLinkStyle}>Crews (Multi-Agent Teams)</a></li>
            <li><a href="#conductor" style={tocLinkStyle}>Conductor (Mission Orchestration)</a></li>
            <li><a href="#tasks" style={tocLinkStyle}>Tasks (Kanban Board)</a></li>
            <li><a href="#jobs" style={tocLinkStyle}>Jobs (Cron Scheduler)</a></li>
            <li><a href="#memory" style={tocLinkStyle}>Memory &amp; Knowledge Graph</a></li>
            <li><a href="#skills" style={tocLinkStyle}>Skills</a></li>
            <li><a href="#agents" style={tocLinkStyle}>Agents (Custom Personas)</a></li>
            <li><a href="#files-terminal" style={tocLinkStyle}>Files &amp; Terminal</a></li>
            <li><a href="#analytics" style={tocLinkStyle}>Analytics &amp; Audit</a></li>
            <li><a href="#settings" style={tocLinkStyle}>Settings &amp; Configuration</a></li>
            <li><a href="#keyboard-shortcuts" style={tocLinkStyle}>Keyboard Shortcuts</a></li>
            <li><a href="#troubleshooting" style={tocLinkStyle}>Troubleshooting</a></li>
          </ol>
        </nav>

        {/* Section 1: Getting Started */}
        <section id="getting-started" style={sectionStyle}>
          <h2 style={h2Style}>1. Getting Started</h2>

          <h3 style={h3Style}>Connecting to Hermes Gateway</h3>
          <p style={pStyle}>
            Hermes Studio communicates with your AI agents through the Hermes Gateway server. Before you can use any features, you need to establish a connection.
          </p>
          <ol style={olStyle}>
            <li>Open the Settings screen by clicking the gear icon in the sidebar or pressing <kbd style={kbdStyle}>Ctrl+,</kbd>.</li>
            <li>In the Connection section, enter your Gateway URL (e.g., <code>http://localhost:3001</code> or your remote server address).</li>
            <li>If your gateway requires an API key, enter it in the API Key field.</li>
            <li>Click <strong>Test Connection</strong> to verify connectivity.</li>
            <li>A green indicator in the top bar confirms a successful connection.</li>
          </ol>
          <div style={tipStyle}>
            <strong>Tip:</strong> If you are running Hermes Gateway locally, the default URL is usually <code>http://localhost:3001</code>. The connection status indicator in the top navigation bar shows green when connected and red when disconnected.
          </div>

          <h3 style={h3Style}>First-time Setup</h3>
          <p style={pStyle}>
            When you first launch Hermes Studio, a setup wizard may appear to guide you through initial configuration. If it does not appear, follow these steps:
          </p>
          <ol style={olStyle}>
            <li>Configure your gateway connection (see above).</li>
            <li>Navigate to Settings and choose your preferred theme and accent color under Appearance.</li>
            <li>Optionally set up your identity files (SOUL.md and persona.md) under the Identity section to personalize your AI interactions.</li>
            <li>Browse the Skills registry and install any skills your workflow requires.</li>
          </ol>

          <h3 style={h3Style}>Navigation Overview</h3>
          <p style={pStyle}>
            The left sidebar is your primary navigation. Each icon represents a major feature area:
          </p>
          <ul style={ulStyle}>
            <li><strong>Chat</strong> - Direct conversations with your AI agent</li>
            <li><strong>Crews</strong> - Multi-agent team management</li>
            <li><strong>Conductor</strong> - Mission orchestration and monitoring</li>
            <li><strong>Tasks</strong> - Kanban-style task board</li>
            <li><strong>Jobs</strong> - Scheduled/cron job management</li>
            <li><strong>Memory</strong> - Knowledge graph and memory files</li>
            <li><strong>Skills</strong> - Skill registry and management</li>
            <li><strong>Agents</strong> - Custom agent personas</li>
            <li><strong>Files</strong> - File browser and editor</li>
            <li><strong>Terminal</strong> - Integrated terminal</li>
            <li><strong>Analytics</strong> - Usage analytics and audit logs</li>
            <li><strong>Settings</strong> - App configuration</li>
          </ul>
          <p style={pStyle}>
            The sidebar can be collapsed by clicking the hamburger menu icon at the top. On smaller screens, it collapses automatically.
          </p>
        </section>

        {/* Section 2: Chat */}
        <section id="chat" style={sectionStyle}>
          <h2 style={h2Style}>2. Chat</h2>

          <h3 style={h3Style}>Starting a Conversation</h3>
          <p style={pStyle}>
            The Chat screen is your primary interface for interacting with the AI agent. To start a new conversation:
          </p>
          <ol style={olStyle}>
            <li>Click the <strong>Chat</strong> icon in the sidebar to open the chat screen.</li>
            <li>Type your message in the input field at the bottom of the screen.</li>
            <li>Press <kbd style={kbdStyle}>Enter</kbd> to send your message, or <kbd style={kbdStyle}>Shift+Enter</kbd> for a new line without sending.</li>
            <li>The AI will begin streaming its response in real-time.</li>
          </ol>

          <h3 style={h3Style}>Managing Sessions</h3>
          <p style={pStyle}>
            Each conversation exists within a session. You can manage sessions using the session panel:
          </p>
          <ul style={ulStyle}>
            <li>Click the <strong>+</strong> button in the sessions sidebar to create a new session.</li>
            <li>Click on any existing session in the list to switch to it.</li>
            <li>Right-click a session to rename or delete it.</li>
            <li>Sessions persist across app restarts so you can continue conversations later.</li>
          </ul>

          <h3 style={h3Style}>Approvals (Approve / Deny / Always-Allow)</h3>
          <p style={pStyle}>
            When the AI wants to perform an action that requires permission (like running a command, writing a file, or accessing a resource), an approval prompt appears:
          </p>
          <ul style={ulStyle}>
            <li><strong>Approve</strong> - Allow this specific action once.</li>
            <li><strong>Deny</strong> - Reject this action. The AI will be informed and may suggest an alternative.</li>
            <li><strong>Always Allow</strong> - Approve this type of action permanently for the current session. The permission is remembered so you won't be asked again for the same tool or pattern.</li>
          </ul>
          <div style={noteStyle}>
            <strong>Note:</strong> You can review and manage always-allow permissions in Settings under Permissions &amp; Security.
          </div>

          <h3 style={h3Style}>File Attachments</h3>
          <p style={pStyle}>
            You can attach files to your messages for the AI to analyze or work with:
          </p>
          <ol style={olStyle}>
            <li>Click the paperclip icon next to the message input.</li>
            <li>Select one or more files from the file picker dialog.</li>
            <li>Attached files appear as chips above the input field. Click the X on a chip to remove it.</li>
            <li>Send your message as normal - the AI will have access to the file contents.</li>
          </ol>

          <h3 style={h3Style}>Streaming Responses</h3>
          <p style={pStyle}>
            Responses stream in token-by-token for a real-time experience. While a response is streaming:
          </p>
          <ul style={ulStyle}>
            <li>You can click the <strong>Stop</strong> button to halt generation at any point.</li>
            <li>Tool calls and their results appear inline as collapsible blocks.</li>
            <li>Code blocks are syntax-highlighted and include a copy button.</li>
            <li>Markdown formatting (headings, lists, tables, links) renders automatically.</li>
          </ul>
        </section>

        {/* Section 3: Crews */}
        <section id="crews" style={sectionStyle}>
          <h2 style={h2Style}>3. Crews (Multi-Agent Teams)</h2>

          <h3 style={h3Style}>Creating a Crew</h3>
          <p style={pStyle}>
            Crews let you organize multiple AI agents into a team that can collaborate on complex tasks. To create a new crew:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Crews</strong> screen from the sidebar.</li>
            <li>Click the <strong>+ New Crew</strong> button in the top-right corner.</li>
            <li>Enter a name and optional description for your crew.</li>
            <li>Choose whether to start from scratch or use a template.</li>
            <li>Click <strong>Create</strong> to finalize.</li>
          </ol>

          <h3 style={h3Style}>Adding Members</h3>
          <p style={pStyle}>
            After creating a crew, you need to add agent members who will participate:
          </p>
          <ol style={olStyle}>
            <li>Open your crew by clicking on it in the crew list.</li>
            <li>Click <strong>Add Member</strong> in the members panel.</li>
            <li>Select an agent from your available agents, or create a new one inline.</li>
            <li>Assign a role to the member (e.g., Researcher, Developer, Reviewer).</li>
            <li>Optionally set specific instructions that override the agent's default prompt for this crew context.</li>
          </ol>

          <h3 style={h3Style}>Using Templates</h3>
          <p style={pStyle}>
            Templates provide pre-configured crew setups for common workflows:
          </p>
          <ul style={ulStyle}>
            <li><strong>Research Team</strong> - A crew configured for deep research with specialized researcher and summarizer agents.</li>
            <li><strong>Development Team</strong> - Includes architect, developer, and code reviewer agents.</li>
            <li><strong>Content Team</strong> - Writer, editor, and fact-checker agents for content creation.</li>
          </ul>
          <p style={pStyle}>
            Select a template during crew creation to pre-populate the crew with appropriate members and settings.
          </p>

          <h3 style={h3Style}>Dispatching Tasks</h3>
          <p style={pStyle}>
            Once your crew is set up, you can dispatch tasks to it:
          </p>
          <ol style={olStyle}>
            <li>Open the crew detail view.</li>
            <li>Click <strong>Dispatch Task</strong> or use the input field at the bottom.</li>
            <li>Describe what you want the crew to accomplish.</li>
            <li>The task will be distributed among crew members according to their roles and the workflow configuration.</li>
          </ol>

          <h3 style={h3Style}>Cloning Crews</h3>
          <p style={pStyle}>
            To duplicate an existing crew with all its configuration:
          </p>
          <ol style={olStyle}>
            <li>Right-click the crew in the list or click the three-dot menu on the crew card.</li>
            <li>Select <strong>Clone Crew</strong>.</li>
            <li>A new crew is created with the same members, roles, and settings. You can rename it and modify as needed.</li>
          </ol>

          <h3 style={h3Style}>Workflow Builder (DAG Editor)</h3>
          <p style={pStyle}>
            The workflow builder lets you define how tasks flow between crew members using a visual directed acyclic graph (DAG):
          </p>
          <ol style={olStyle}>
            <li>Open a crew and switch to the <strong>Workflow</strong> tab.</li>
            <li>Each crew member appears as a node on the canvas.</li>
            <li>Drag connections between nodes to define task flow (who passes work to whom).</li>
            <li>Click a connection to configure conditions or transformations.</li>
            <li>Use the toolbar to add decision nodes, parallel branches, or merge points.</li>
            <li>Save your workflow with the <strong>Save</strong> button or <kbd style={kbdStyle}>Ctrl+S</kbd>.</li>
          </ol>
          <div style={tipStyle}>
            <strong>Tip:</strong> You can zoom and pan the canvas using scroll and drag. Double-click a node to edit its properties.
          </div>

          <h3 style={h3Style}>Monitoring Crew Operations</h3>
          <p style={pStyle}>
            While a crew is working, you can monitor progress:
          </p>
          <ul style={ulStyle}>
            <li>The crew card shows a live status indicator (idle, working, completed, errored).</li>
            <li>Click into the crew to see each member's current activity.</li>
            <li>A timeline view shows the sequence of actions and handoffs between members.</li>
            <li>Output from each member is displayed in their respective panel.</li>
          </ul>
        </section>

        {/* Section 4: Conductor */}
        <section id="conductor" style={sectionStyle}>
          <h2 style={h2Style}>4. Conductor (Mission Orchestration)</h2>

          <h3 style={h3Style}>Starting a Mission</h3>
          <p style={pStyle}>
            The Conductor is your command center for orchestrating complex, multi-step missions. To start a new mission:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Conductor</strong> screen from the sidebar.</li>
            <li>Type your mission objective in the main input field. Be as specific as possible about what you want to accomplish.</li>
            <li>Click <strong>Start Mission</strong> or press <kbd style={kbdStyle}>Ctrl+Enter</kbd>.</li>
            <li>The Conductor will analyze your objective, create a plan, and begin dispatching workers.</li>
          </ol>

          <h3 style={h3Style}>Quick Actions (Research / Build / Review / Deploy)</h3>
          <p style={pStyle}>
            For common mission types, use the quick action buttons below the input:
          </p>
          <ul style={ulStyle}>
            <li><strong>Research</strong> - Launches a research-focused mission with agents configured for information gathering and synthesis.</li>
            <li><strong>Build</strong> - Creates a development mission with code-writing workers and automated testing.</li>
            <li><strong>Review</strong> - Starts a code review mission that examines your repository for issues, improvements, and best practices.</li>
            <li><strong>Deploy</strong> - Initiates a deployment pipeline mission with pre-deployment checks and rollout steps.</li>
          </ul>
          <p style={pStyle}>
            Each quick action pre-configures the appropriate model, worker count, and supervision settings for that task type.
          </p>

          <h3 style={h3Style}>Settings (Models, Parallel Workers, Supervised Mode)</h3>
          <p style={pStyle}>
            Before starting a mission, configure its parameters by clicking the gear icon next to the input:
          </p>
          <ul style={ulStyle}>
            <li><strong>Model</strong> - Choose which AI model powers the mission (e.g., Claude Opus, Claude Sonnet). More capable models handle complex reasoning better but cost more.</li>
            <li><strong>Parallel Workers</strong> - Set how many agents work simultaneously (1-8). More workers speed up execution but increase cost.</li>
            <li><strong>Supervised Mode</strong> - When enabled, the Conductor pauses before each major action and asks for your approval. Disable for fully autonomous operation.</li>
          </ul>

          <h3 style={h3Style}>The Office View (3 Layouts)</h3>
          <p style={pStyle}>
            The Office View is an animated visualization of your active mission. It shows workers as animated characters sitting at desks, working on their assigned subtasks. You can switch between three layouts:
          </p>
          <ul style={ulStyle}>
            <li><strong>Grid Layout</strong> - Workers arranged in a grid pattern. Best for seeing many workers at once. Each worker occupies a cell showing their avatar, current task summary, and status indicator.</li>
            <li><strong>Row Layout</strong> - Workers displayed in horizontal rows with more detail visible per worker. Shows expanded task descriptions and recent output snippets.</li>
            <li><strong>Focus Layout</strong> - Highlights one worker at a time in a large central view with full output streaming. Other workers appear as small thumbnails on the side. Click a thumbnail to focus on a different worker.</li>
          </ul>
          <p style={pStyle}>
            Switch layouts using the layout toggle buttons in the top-right corner of the Office View. Workers are animated: they show a typing animation when actively generating, a thinking animation when processing, and an idle state when waiting for input.
          </p>

          <h3 style={h3Style}>Monitoring Workers</h3>
          <p style={pStyle}>
            Each worker in the Office View displays:
          </p>
          <ul style={ulStyle}>
            <li>A colored status ring: blue (working), green (completed subtask), yellow (waiting for approval), red (error).</li>
            <li>The current subtask being worked on as a title above the worker.</li>
            <li>A progress indicator showing how far through the subtask they are.</li>
            <li>Click any worker to expand their detail panel and see full streaming output.</li>
          </ul>

          <h3 style={h3Style}>Pause / Resume / Abort</h3>
          <p style={pStyle}>
            Control a running mission with the transport controls in the top bar:
          </p>
          <ul style={ulStyle}>
            <li><strong>Pause</strong> - Temporarily halts all workers. They finish their current token generation but don't start new subtasks. Click <strong>Resume</strong> to continue.</li>
            <li><strong>Resume</strong> - Resumes a paused mission from where it left off.</li>
            <li><strong>Abort</strong> - Permanently stops the mission. All workers are terminated. This cannot be undone, but you can start a new mission with the same objective.</li>
          </ul>

          <h3 style={h3Style}>Mission History and Cost Tracking</h3>
          <p style={pStyle}>
            All completed and aborted missions are saved in your mission history:
          </p>
          <ul style={ulStyle}>
            <li>Click the <strong>History</strong> tab to view past missions.</li>
            <li>Each entry shows the objective, status, duration, and total cost.</li>
            <li>Cost is broken down by model usage (input tokens, output tokens) per worker.</li>
            <li>Click a historical mission to review its full output and timeline.</li>
          </ul>
        </section>

        {/* Section 5: Tasks */}
        <section id="tasks" style={sectionStyle}>
          <h2 style={h2Style}>5. Tasks (Kanban Board)</h2>

          <h3 style={h3Style}>Creating Tasks</h3>
          <p style={pStyle}>
            The Tasks screen presents a Kanban board for organizing work items. To create a new task:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Tasks</strong> screen from the sidebar.</li>
            <li>Click the <strong>+</strong> button at the top of any column (Backlog, In Progress, Review, Done).</li>
            <li>Enter a title for the task.</li>
            <li>Optionally add a description, set priority, add tags, and assign to an agent or crew.</li>
            <li>Click <strong>Create</strong> or press <kbd style={kbdStyle}>Enter</kbd> to add the task to that column.</li>
          </ol>

          <h3 style={h3Style}>Drag-and-Drop Between Columns</h3>
          <p style={pStyle}>
            Move tasks between columns by clicking and dragging:
          </p>
          <ol style={olStyle}>
            <li>Click and hold a task card.</li>
            <li>Drag it to the desired column.</li>
            <li>Release to drop it in place. The task's status updates automatically.</li>
            <li>You can also reorder tasks within a column by dragging them up or down.</li>
          </ol>

          <h3 style={h3Style}>Priority, Tags, and Assignees</h3>
          <p style={pStyle}>
            Each task can be enriched with metadata:
          </p>
          <ul style={ulStyle}>
            <li><strong>Priority</strong> - Click the flag icon to cycle through priorities: None, Low, Medium, High, Critical. High and Critical tasks are visually highlighted.</li>
            <li><strong>Tags</strong> - Add colored labels to categorize tasks (e.g., "bug", "feature", "docs"). Click the tag icon to add or create tags.</li>
            <li><strong>Assignees</strong> - Assign tasks to specific agents or crews. Click the avatar icon and select from available agents.</li>
          </ul>

          <h3 style={h3Style}>Cross-linking with Crews / Conductor</h3>
          <p style={pStyle}>
            Tasks can be linked to crew operations or conductor missions:
          </p>
          <ul style={ulStyle}>
            <li>When a Conductor mission creates subtasks, they automatically appear on the Kanban board with a link back to the mission.</li>
            <li>You can manually link a task to a crew by clicking <strong>Link to Crew</strong> in the task detail view.</li>
            <li>Linked tasks show status updates from the associated crew or mission.</li>
          </ul>
        </section>

        {/* Section 6: Jobs */}
        <section id="jobs" style={sectionStyle}>
          <h2 style={h2Style}>6. Jobs (Cron Scheduler)</h2>

          <h3 style={h3Style}>Creating Scheduled Jobs</h3>
          <p style={pStyle}>
            Jobs let you schedule recurring AI tasks on a cron schedule. To create a new job:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Jobs</strong> screen from the sidebar.</li>
            <li>Click <strong>+ New Job</strong> in the top-right corner.</li>
            <li>Enter a name and description for the job.</li>
            <li>Define the prompt or task the AI should execute on each run.</li>
            <li>Set the schedule (see below).</li>
            <li>Configure delivery channels for output.</li>
            <li>Click <strong>Create Job</strong> to save.</li>
          </ol>

          <h3 style={h3Style}>Schedule Presets and Custom Cron</h3>
          <p style={pStyle}>
            Choose from common presets or write a custom cron expression:
          </p>
          <ul style={ulStyle}>
            <li><strong>Every hour</strong> - Runs at the top of each hour.</li>
            <li><strong>Every day at 9am</strong> - Daily morning execution.</li>
            <li><strong>Every Monday</strong> - Weekly on Monday at midnight.</li>
            <li><strong>Custom</strong> - Enter any valid cron expression (e.g., <code>*/15 * * * *</code> for every 15 minutes).</li>
          </ul>
          <p style={pStyle}>
            The schedule preview below the input shows the next 5 planned execution times so you can verify your schedule is correct.
          </p>

          <h3 style={h3Style}>Delivery Channels</h3>
          <p style={pStyle}>
            Configure where job output is sent after each run:
          </p>
          <ul style={ulStyle}>
            <li><strong>In-App</strong> - Results appear in the Jobs screen run history (always enabled).</li>
            <li><strong>Telegram</strong> - Send results to a Telegram chat or group.</li>
            <li><strong>Discord</strong> - Post results to a Discord channel via webhook.</li>
            <li><strong>Slack</strong> - Send to a Slack channel.</li>
            <li><strong>Email</strong> - Email the results to specified addresses.</li>
          </ul>

          <h3 style={h3Style}>Triggering Jobs Manually</h3>
          <p style={pStyle}>
            You don't have to wait for the schedule to test a job:
          </p>
          <ol style={olStyle}>
            <li>Find the job in the jobs list.</li>
            <li>Click the <strong>Run Now</strong> button (play icon) on the job card.</li>
            <li>The job executes immediately and results appear in the run history.</li>
          </ol>

          <h3 style={h3Style}>Monitoring Run History</h3>
          <p style={pStyle}>
            Each job tracks its execution history:
          </p>
          <ul style={ulStyle}>
            <li>Click on a job to see its detail view with the full run history.</li>
            <li>Each run shows: timestamp, duration, status (success/failure), and output.</li>
            <li>Failed runs display error details so you can diagnose issues.</li>
            <li>Use the <strong>Clear History</strong> button to remove old runs if the list gets long.</li>
          </ul>
        </section>

        {/* Section 7: Memory */}
        <section id="memory" style={sectionStyle}>
          <h2 style={h2Style}>7. Memory &amp; Knowledge Graph</h2>

          <h3 style={h3Style}>Browsing Memory Files</h3>
          <p style={pStyle}>
            The Memory screen gives you access to the AI's persistent memory stored as structured files:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Memory</strong> screen from the sidebar.</li>
            <li>The file tree on the left shows all memory files organized by category.</li>
            <li>Click any file to view its contents in the main panel.</li>
            <li>Memory files are typically Markdown documents containing facts, preferences, and learned context.</li>
          </ol>

          <h3 style={h3Style}>The Knowledge Graph Visualization</h3>
          <p style={pStyle}>
            Switch to the <strong>Graph</strong> tab to see an interactive visualization of how memory entries are connected:
          </p>
          <ul style={ulStyle}>
            <li>Nodes represent individual memory entries or concepts.</li>
            <li>Edges show relationships between entries (references, dependencies, categories).</li>
            <li>Hover over a node to see a preview of its content.</li>
            <li>Click a node to open the full entry in the detail panel.</li>
            <li>Use scroll to zoom in/out and drag to pan the graph.</li>
            <li>The graph auto-layouts using a force-directed algorithm but you can drag nodes to reposition them.</li>
          </ul>

          <h3 style={h3Style}>Searching Entries</h3>
          <p style={pStyle}>
            Use the search bar at the top of the Memory screen to find specific entries:
          </p>
          <ul style={ulStyle}>
            <li>Type keywords to filter the file list and highlight matching entries.</li>
            <li>Search looks at file names, content, and tags.</li>
            <li>Results update in real-time as you type.</li>
          </ul>

          <h3 style={h3Style}>Editing Memory</h3>
          <p style={pStyle}>
            You can manually edit memory entries to correct or augment the AI's knowledge:
          </p>
          <ol style={olStyle}>
            <li>Open a memory file by clicking it in the tree.</li>
            <li>Click the <strong>Edit</strong> button (pencil icon) to enter editing mode.</li>
            <li>Modify the Markdown content as needed.</li>
            <li>Click <strong>Save</strong> or press <kbd style={kbdStyle}>Ctrl+S</kbd> to persist your changes.</li>
          </ol>
          <div style={tipStyle}>
            <strong>Tip:</strong> Changes to memory files take effect immediately. The AI will use updated information in subsequent conversations.
          </div>
        </section>

        {/* Section 8: Skills */}
        <section id="skills" style={sectionStyle}>
          <h2 style={h2Style}>8. Skills</h2>

          <h3 style={h3Style}>Browsing the Skill Registry</h3>
          <p style={pStyle}>
            Skills are modular capabilities that extend what the AI can do. To browse available skills:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Skills</strong> screen from the sidebar.</li>
            <li>The registry shows all available skills as cards with their name, description, and status.</li>
            <li>Use the search bar to filter skills by name or category.</li>
            <li>Click a skill card to see full details including documentation and configuration options.</li>
          </ol>

          <h3 style={h3Style}>Installing Skills</h3>
          <p style={pStyle}>
            To add a new skill to your setup:
          </p>
          <ol style={olStyle}>
            <li>Find the skill you want in the registry.</li>
            <li>Click the <strong>Install</strong> button on the skill card.</li>
            <li>If the skill requires configuration (API keys, parameters), a configuration form appears. Fill in the required fields.</li>
            <li>Click <strong>Confirm</strong> to complete installation.</li>
            <li>The skill is now available for use in conversations, crews, and missions.</li>
          </ol>

          <h3 style={h3Style}>Enabling / Disabling Skills</h3>
          <p style={pStyle}>
            You can temporarily disable a skill without uninstalling it:
          </p>
          <ul style={ulStyle}>
            <li>Toggle the switch on any installed skill card to enable or disable it.</li>
            <li>Disabled skills remain configured but are not available to the AI.</li>
            <li>This is useful for troubleshooting or temporarily limiting the AI's capabilities.</li>
          </ul>
        </section>

        {/* Section 9: Agents */}
        <section id="agents" style={sectionStyle}>
          <h2 style={h2Style}>9. Agents (Custom Personas)</h2>

          <h3 style={h3Style}>Creating Custom Agents</h3>
          <p style={pStyle}>
            Agents are custom AI personas with specific behaviors and expertise. To create one:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Agents</strong> screen from the sidebar.</li>
            <li>Click <strong>+ New Agent</strong> in the top-right.</li>
            <li>Enter a name for the agent (e.g., "Code Reviewer", "Technical Writer").</li>
            <li>Write a system prompt that defines the agent's personality, expertise, and behavior rules.</li>
            <li>Customize the appearance (emoji avatar and accent color).</li>
            <li>Click <strong>Create</strong> to save the agent.</li>
          </ol>

          <h3 style={h3Style}>Emoji and Color Customization</h3>
          <p style={pStyle}>
            Make your agents visually distinct:
          </p>
          <ul style={ulStyle}>
            <li>Click the emoji picker to choose an avatar emoji that represents the agent's role.</li>
            <li>Select an accent color from the color palette. This color is used in the agent's chat bubbles, crew member indicators, and Conductor worker rings.</li>
            <li>Both emoji and color appear wherever the agent is referenced throughout the app.</li>
          </ul>

          <h3 style={h3Style}>System Prompts</h3>
          <p style={pStyle}>
            The system prompt is the core of an agent's identity. Write it to define:
          </p>
          <ul style={ulStyle}>
            <li><strong>Role</strong> - What the agent is (e.g., "You are a senior backend engineer specializing in distributed systems").</li>
            <li><strong>Behavior</strong> - How the agent should respond (e.g., "Always suggest tests for code changes").</li>
            <li><strong>Constraints</strong> - What the agent should avoid (e.g., "Never modify production configuration files").</li>
            <li><strong>Tone</strong> - The communication style (e.g., "Be concise and direct. Use bullet points.").</li>
          </ul>

          <h3 style={h3Style}>Using Agents in Crews</h3>
          <p style={pStyle}>
            Once created, agents can be assigned to crews:
          </p>
          <ul style={ulStyle}>
            <li>When adding members to a crew, your custom agents appear in the agent selection dropdown.</li>
            <li>Each agent brings its system prompt and personality to the crew context.</li>
            <li>You can override specific instructions per-crew without changing the agent's base configuration.</li>
          </ul>
        </section>

        {/* Section 10: Files & Terminal */}
        <section id="files-terminal" style={sectionStyle}>
          <h2 style={h2Style}>10. Files &amp; Terminal</h2>

          <h3 style={h3Style}>File Browser Navigation</h3>
          <p style={pStyle}>
            The Files screen provides a full file browser for navigating your project:
          </p>
          <ul style={ulStyle}>
            <li>The left panel shows a file tree. Click folders to expand/collapse them.</li>
            <li>Click a file to open it in the editor panel on the right.</li>
            <li>Right-click files or folders for a context menu with options: Rename, Delete, Copy Path, New File, New Folder.</li>
            <li>Use the breadcrumb path at the top to navigate up the directory tree.</li>
          </ul>

          <h3 style={h3Style}>Editing Files (Monaco Editor)</h3>
          <p style={pStyle}>
            Files open in an integrated Monaco editor (the same editor that powers VS Code):
          </p>
          <ul style={ulStyle}>
            <li>Full syntax highlighting for all major languages.</li>
            <li>IntelliSense-style autocomplete where language servers are available.</li>
            <li>Find and replace with <kbd style={kbdStyle}>Ctrl+F</kbd> and <kbd style={kbdStyle}>Ctrl+H</kbd>.</li>
            <li>Save files with <kbd style={kbdStyle}>Ctrl+S</kbd>. Unsaved changes are indicated by a dot on the file tab.</li>
            <li>Multiple files can be open in tabs simultaneously.</li>
          </ul>

          <h3 style={h3Style}>Terminal Usage</h3>
          <p style={pStyle}>
            The integrated terminal gives you a shell directly within Hermes Studio:
          </p>
          <ol style={olStyle}>
            <li>Navigate to the <strong>Terminal</strong> screen from the sidebar, or press <kbd style={kbdStyle}>Ctrl+`</kbd> to toggle it as a bottom panel.</li>
            <li>The terminal opens in your project's working directory.</li>
            <li>Run any shell command as you would in a regular terminal.</li>
            <li>Multiple terminal tabs are supported - click <strong>+</strong> to create a new tab.</li>
          </ol>
          <div style={noteStyle}>
            <strong>Note:</strong> The terminal is connected to the same system where your Hermes Gateway runs. Commands execute on that machine.
          </div>
        </section>

        {/* Section 11: Analytics & Audit */}
        <section id="analytics" style={sectionStyle}>
          <h2 style={h2Style}>11. Analytics &amp; Audit</h2>

          <h3 style={h3Style}>Event Analytics Dashboard</h3>
          <p style={pStyle}>
            The Analytics screen provides insights into your AI usage patterns:
          </p>
          <ul style={ulStyle}>
            <li>View charts showing messages sent, tokens used, and costs over time.</li>
            <li>Filter by date range using the date picker in the top bar.</li>
            <li>Break down usage by agent, model, or session.</li>
            <li>Export data as CSV for further analysis.</li>
          </ul>

          <h3 style={h3Style}>Session History</h3>
          <p style={pStyle}>
            Review all past chat sessions:
          </p>
          <ul style={ulStyle}>
            <li>Each session shows its start time, message count, and token usage.</li>
            <li>Click a session to view the full conversation transcript.</li>
            <li>Use the search to find sessions by content or date.</li>
          </ul>

          <h3 style={h3Style}>Audit Trail</h3>
          <p style={pStyle}>
            The audit trail logs every significant action the AI has taken:
          </p>
          <ul style={ulStyle}>
            <li>File modifications, command executions, and API calls are all recorded.</li>
            <li>Each entry includes a timestamp, action type, details, and which agent performed it.</li>
            <li>Filter by action type or severity level.</li>
            <li>This is essential for accountability in supervised environments.</li>
          </ul>

          <h3 style={h3Style}>Logs Viewer</h3>
          <p style={pStyle}>
            Access raw system logs for debugging and monitoring:
          </p>
          <ul style={ulStyle}>
            <li>Click the <strong>Logs</strong> tab within Analytics.</li>
            <li>Logs stream in real-time with color-coded severity (info, warning, error).</li>
            <li>Use the filter bar to search for specific log entries.</li>
            <li>Click <strong>Pause</strong> to freeze the log stream for easier reading.</li>
          </ul>
        </section>

        {/* Section 12: Settings */}
        <section id="settings" style={sectionStyle}>
          <h2 style={h2Style}>12. Settings &amp; Configuration</h2>

          <h3 style={h3Style}>Connection Settings</h3>
          <p style={pStyle}>
            Configure how Hermes Studio connects to your gateway:
          </p>
          <ul style={ulStyle}>
            <li><strong>Gateway URL</strong> - The HTTP address of your Hermes Gateway server.</li>
            <li><strong>API Key</strong> - Authentication key for secured gateways.</li>
            <li><strong>Reconnect Interval</strong> - How often to retry if the connection drops (default: 5 seconds).</li>
            <li><strong>WebSocket</strong> - Enable/disable WebSocket for real-time streaming (recommended: enabled).</li>
          </ul>

          <h3 style={h3Style}>Appearance (Themes, Accent Colors)</h3>
          <p style={pStyle}>
            Customize the visual appearance of Hermes Studio:
          </p>
          <ul style={ulStyle}>
            <li><strong>Theme</strong> - Choose from available dark themes. The app is designed as dark-mode only for optimal readability during extended use.</li>
            <li><strong>Accent Color</strong> - Pick a primary accent color that highlights interactive elements, buttons, and active states throughout the UI.</li>
            <li><strong>Font Size</strong> - Adjust the base font size for readability.</li>
            <li>Changes apply immediately with no restart required.</li>
          </ul>

          <h3 style={h3Style}>Integrations (Telegram, Discord, Slack, etc.)</h3>
          <p style={pStyle}>
            Connect external services for notifications and delivery:
          </p>
          <ol style={olStyle}>
            <li>Go to Settings and open the <strong>Integrations</strong> tab.</li>
            <li>Click <strong>Add Integration</strong> and select the service.</li>
            <li>Follow the service-specific setup (e.g., paste a bot token for Telegram, a webhook URL for Discord).</li>
            <li>Test the integration with the <strong>Send Test</strong> button.</li>
            <li>Once configured, these integrations are available as delivery channels in Jobs and notifications.</li>
          </ol>

          <h3 style={h3Style}>MCP Servers</h3>
          <p style={pStyle}>
            Manage Model Context Protocol (MCP) server connections:
          </p>
          <ul style={ulStyle}>
            <li>MCP servers provide additional tools and capabilities to the AI.</li>
            <li>Click <strong>Add MCP Server</strong> to register a new server by URL.</li>
            <li>Each server shows its available tools and connection status.</li>
            <li>Toggle servers on/off to control which tools are available.</li>
          </ul>

          <h3 style={h3Style}>Permissions &amp; Security</h3>
          <p style={pStyle}>
            Control what the AI is allowed to do:
          </p>
          <ul style={ulStyle}>
            <li><strong>Auto-approved paths</strong> - File paths where the AI can read/write without asking permission.</li>
            <li><strong>Blocked commands</strong> - Shell commands the AI is never allowed to run.</li>
            <li><strong>Always-allow rules</strong> - Review and revoke previously granted always-allow permissions from chat.</li>
            <li><strong>Supervised mode default</strong> - Set whether new missions start in supervised mode by default.</li>
          </ul>

          <h3 style={h3Style}>Identity Files (SOUL.md, persona.md)</h3>
          <p style={pStyle}>
            Identity files shape the AI's core personality across all interactions:
          </p>
          <ul style={ulStyle}>
            <li><strong>SOUL.md</strong> - Defines the AI's fundamental values, communication style, and behavioral principles. This is the deepest layer of personality.</li>
            <li><strong>persona.md</strong> - A more surface-level personality file that defines tone, preferences, and interaction patterns.</li>
            <li>Edit these files in the Identity section of Settings or directly via the Files screen.</li>
            <li>Changes take effect in new conversations; existing sessions keep their original context.</li>
          </ul>

          <h3 style={h3Style}>Systemd Auto-start</h3>
          <p style={pStyle}>
            Configure Hermes Gateway to start automatically with your system:
          </p>
          <ol style={olStyle}>
            <li>In Settings, find the <strong>System</strong> section.</li>
            <li>Click <strong>Install Systemd Service</strong>.</li>
            <li>The app generates a systemd unit file and installs it for your user.</li>
            <li>Use the <strong>Enable</strong> toggle to control whether it starts on boot.</li>
            <li>The <strong>Status</strong> indicator shows whether the service is currently active.</li>
          </ol>
        </section>

        {/* Section 13: Keyboard Shortcuts */}
        <section id="keyboard-shortcuts" style={sectionStyle}>
          <h2 style={h2Style}>13. Keyboard Shortcuts</h2>
          <p style={pStyle}>
            Hermes Studio supports keyboard shortcuts for quick navigation and common actions. Below is the full reference:
          </p>

          <h3 style={h3Style}>Global Navigation</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Shortcut</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>1</kbd></td>
                <td style={tdStyle}>Go to Chat</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>2</kbd></td>
                <td style={tdStyle}>Go to Crews</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>3</kbd></td>
                <td style={tdStyle}>Go to Conductor</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>4</kbd></td>
                <td style={tdStyle}>Go to Tasks</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>5</kbd></td>
                <td style={tdStyle}>Go to Jobs</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>6</kbd></td>
                <td style={tdStyle}>Go to Memory</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>7</kbd></td>
                <td style={tdStyle}>Go to Files</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>,</kbd></td>
                <td style={tdStyle}>Open Settings</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>K</kbd></td>
                <td style={tdStyle}>Open Command Palette</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>B</kbd></td>
                <td style={tdStyle}>Toggle Sidebar</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Chat</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Shortcut</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Enter</kbd></td>
                <td style={tdStyle}>Send message</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Shift</kbd> + <kbd style={kbdStyle}>Enter</kbd></td>
                <td style={tdStyle}>New line in message</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>N</kbd></td>
                <td style={tdStyle}>New session</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Escape</kbd></td>
                <td style={tdStyle}>Stop streaming response</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>L</kbd></td>
                <td style={tdStyle}>Clear chat display</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Editor</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Shortcut</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>S</kbd></td>
                <td style={tdStyle}>Save file</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>F</kbd></td>
                <td style={tdStyle}>Find in file</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>H</kbd></td>
                <td style={tdStyle}>Find and replace</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Z</kbd></td>
                <td style={tdStyle}>Undo</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Shift</kbd> + <kbd style={kbdStyle}>Z</kbd></td>
                <td style={tdStyle}>Redo</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>W</kbd></td>
                <td style={tdStyle}>Close current tab</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Conductor</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Shortcut</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Enter</kbd></td>
                <td style={tdStyle}>Start mission</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Space</kbd></td>
                <td style={tdStyle}>Pause / Resume mission</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>.</kbd></td>
                <td style={tdStyle}>Abort mission</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>1</kbd> / <kbd style={kbdStyle}>2</kbd> / <kbd style={kbdStyle}>3</kbd></td>
                <td style={tdStyle}>Switch Office View layout (Grid / Row / Focus)</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>Terminal</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Shortcut</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>`</kbd></td>
                <td style={tdStyle}>Toggle terminal panel</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Shift</kbd> + <kbd style={kbdStyle}>T</kbd></td>
                <td style={tdStyle}>New terminal tab</td>
              </tr>
              <tr>
                <td style={tdStyle}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>C</kbd></td>
                <td style={tdStyle}>Interrupt running command</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 14: Troubleshooting */}
        <section id="troubleshooting" style={{ paddingBottom: '2rem', marginBottom: '2rem' }}>
          <h2 style={h2Style}>14. Troubleshooting</h2>

          <h3 style={h3Style}>Connection Issues</h3>
          <p style={pStyle}>
            If the connection indicator shows red or you see "Disconnected" messages:
          </p>
          <ol style={olStyle}>
            <li>Verify your Gateway URL is correct in Settings (check for typos, correct port number).</li>
            <li>Ensure the Hermes Gateway server is running. If you installed it as a systemd service, check with: <code>systemctl --user status hermes-gateway</code>.</li>
            <li>Check that no firewall is blocking the connection port.</li>
            <li>If using a remote server, ensure your network can reach it (try pinging the host).</li>
            <li>Try the <strong>Test Connection</strong> button in Settings - it provides specific error messages.</li>
          </ol>

          <h3 style={h3Style}>Gateway Not Responding</h3>
          <p style={pStyle}>
            If the gateway is reachable but not responding to requests:
          </p>
          <ul style={ulStyle}>
            <li>Check the gateway's own logs for errors (usually in the terminal where it's running or via <code>journalctl --user -u hermes-gateway</code>).</li>
            <li>Verify your API key is correct and has not expired.</li>
            <li>Restart the gateway service and try again.</li>
            <li>Ensure the AI provider (Anthropic, etc.) API keys configured in the gateway are valid.</li>
          </ul>

          <h3 style={h3Style}>Features Showing as Unavailable</h3>
          <p style={pStyle}>
            If certain features appear grayed out or show "unavailable":
          </p>
          <ul style={ulStyle}>
            <li>Some features require specific gateway capabilities. Update your Hermes Gateway to the latest version.</li>
            <li>Check that required skills are installed and enabled in the Skills screen.</li>
            <li>Verify your gateway's configuration includes the necessary modules (e.g., the conductor module for missions).</li>
            <li>Ensure your connection has the appropriate permissions. Some gateways restrict features by API key scope.</li>
          </ul>

          <h3 style={h3Style}>Rate Limits</h3>
          <p style={pStyle}>
            If you encounter rate limit errors:
          </p>
          <ul style={ulStyle}>
            <li>Rate limits come from the underlying AI provider (e.g., Anthropic's API limits).</li>
            <li>Reduce the number of parallel workers in Conductor missions.</li>
            <li>Space out rapid-fire chat messages.</li>
            <li>Consider using a lower-tier model for less critical tasks to preserve quota for important work.</li>
            <li>Check your AI provider's dashboard to see your current usage and limits.</li>
            <li>If you consistently hit limits, contact your AI provider about upgrading your tier.</li>
          </ul>
          <div style={tipStyle}>
            <strong>Tip:</strong> The Analytics screen shows your token usage over time, which can help you identify usage patterns and plan accordingly.
          </div>
        </section>

        <footer style={{ textAlign: 'center', padding: '2rem 0', borderTop: '1px solid var(--theme-border-subtle)', color: 'var(--theme-muted)', fontSize: '0.85rem' }}>
          <p>Hermes Studio Help - Last updated April 2026</p>
        </footer>
      </div>
    </div>
  )
}
