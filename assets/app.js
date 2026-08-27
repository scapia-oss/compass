const pages = [
  {
    group: "Get Started",
    id: "overview",
    title: "Overview",
    summary: "Compass gives Claude Code a practical workflow for turning rough ideas into requirements, design, tasks, implementation, review, validation, and learning.",
    badges: ["Setup", "Concept"],
    content: `
      <section class="hero">
        <div class="eyebrow">Claude Code plugin</div>
        <h1>Compass</h1>
        <p class="lead">Spec-driven development for Claude Code. Install it, bootstrap project memory, choose the right workflow, and keep decisions visible from idea to validation.</p>
        <div class="actions">
          <a class="button primary" href="#quick-install">Install Compass</a>
          <a class="button" href="#why-sdd">Why SDD?</a>
          <a class="button" href="#first-10-minutes">First 10 minutes</a>
          <a class="button" href="#command-chooser">Pick a command</a>
        </div>
      </section>
      <section class="section">
        <h2>Why This Exists</h2>
        <p>AI coding tools made it easy to turn an idea into a diff. They did not automatically solve the harder team problem: keeping intent, design decisions, implementation boundaries, review feedback, and validation evidence visible after the chat scrolls away.</p>
        <p>Compass starts from that gap. It treats the first prompt as a starting point, not a contract. The workflow asks what you are trying to change, captures the important answers, writes durable project memory, and only then routes the work into requirements, design, tasks, implementation, validation, or a faster low-risk path.</p>
        <div class="callout"><strong>Background:</strong> Compass is a Claude Code plugin forked from <a href="https://github.com/gotalab/cc-sdd">cc-sdd</a> and inspired by <a href="https://kiro.dev/docs/specs/">AWS Kiro's spec-driven development model</a>. The goal is practical: bring spec-first discipline, steering, and command gates into everyday Claude Code sessions.</div>
      </section>
      <section class="section">
        <h2>What Compass Adds</h2>
        <div class="grid">
          <div class="card"><h3>Project memory</h3><p>Steering files teach the agent what this repository is, how it is built, and how the code is organized.</p></div>
          <div class="card"><h3>Durable specs</h3><p>Specs under <code>.kiro/specs/</code> capture requirements, design, tasks, validation, and decisions.</p></div>
          <div class="card"><h3>Named gates</h3><p>Commands make the workflow explicit: discovery, design, implementation, review, debugging, validation, and retrospective.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>What Changes In Practice</h2>
        <div class="grid two">
          <div class="card"><h3>Before code, clarify the job</h3><p><code>/kiro:discovery</code> turns rough ideas into a scoped path. It can route to no spec, a quick spec, a full spec, an existing spec, or a multi-spec roadmap.</p></div>
          <div class="card"><h3>Before design, load the repo</h3><p>Steering and local evidence keep the agent grounded in the actual project rather than generic architecture advice.</p></div>
          <div class="card"><h3>Before implementation, make tasks executable</h3><p>Tasks are written as implementation milestones with boundaries, dependencies, test intent, and validation expectations.</p></div>
          <div class="card"><h3>Before success, require evidence</h3><p>Implementation commands run build/test/review/verify gates according to risk, and validation catches feature-level drift before handoff.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>The Core Loop</h2>
        <div class="flow">
          <div class="flow-step"><strong>1. Orient</strong><code>/kiro:doctor</code><br><code>/kiro:steering</code></div>
          <div class="flow-step"><strong>2. Shape</strong><code>/kiro:discovery</code><br><code>/kiro:spec-init</code></div>
          <div class="flow-step"><strong>3. Plan</strong>requirements<br>design<br>tasks</div>
          <div class="flow-step"><strong>4. Ship</strong><code>/kiro:impl</code><br><code>/kiro:validate-impl</code></div>
        </div>
      </section>
      <section class="section">
        <h2>Start Here</h2>
        <table>
          <thead><tr><th>Situation</th><th>Run</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>New install</td><td><code>/kiro:doctor</code></td><td>Confirms plugin files, hooks, commands, and repo setup.</td></tr>
            <tr><td>Team is new to specs</td><td><a href="#why-sdd">Why SDD?</a></td><td>Explains why specs come before implementation when AI agents are involved.</td></tr>
            <tr><td>First use in a repository</td><td><code>/kiro:steering</code></td><td>Creates project memory before feature work begins.</td></tr>
            <tr><td>Rough idea</td><td><code>/kiro:discovery "..."</code></td><td>Runs the brainstorm and Q&A loop before choosing the next command.</td></tr>
            <tr><td>Small low-risk change</td><td><code>/kiro:spec-quick "..."</code></td><td>Creates a compact spec without heavy ceremony.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Get Started",
    id: "why-sdd",
    title: "Why Spec-Driven Development?",
    summary: "Why Compass asks teams to write intent, steering, and gates before asking an agent to implement.",
    badges: ["Concept", "Teams"],
    content: `
      <section class="section">
        <h1>Why Spec-Driven Development?</h1>
        <p>AI agents can produce code quickly. The hard part is making that code match the same product intent, repository conventions, review expectations, and implementation boundaries every time. Spec-driven development moves those decisions into shared artifacts before code exists.</p>
        <p>This matters most in brownfield projects. The codebase already has names, boundaries, hidden contracts, migration history, testing habits, and failure modes. A direct prompt asks the model to infer all of that from a narrow slice of context. A spec-first workflow makes the agent gather evidence, write down intent, expose tradeoffs, and then implement against a reviewed plan.</p>
        <div class="callout"><strong>Compass rule:</strong> a prompt is personal; a spec is shared. Requirements, design, tasks, and validation give the agent durable context that teammates can review and rerun.</div>
        <div class="callout"><strong>Inspiration:</strong> Compass is inspired by <a href="https://kiro.dev/docs/specs/">AWS Kiro's spec-driven development model</a>, where specs formalize feature work into requirements, design, and implementation tasks. Compass adapts that idea for Claude Code through project steering, discovery, command gates, validation, and retrospectives.</div>
        <div class="callout"><strong>Origin:</strong> Compass is a fork of <a href="https://github.com/gotalab/cc-sdd">cc-sdd</a>, an MIT-licensed spec-driven development harness. Compass builds on that foundation with its own Claude Code plugin packaging, docs, and workflow guidance.</div>
      </section>
      <section class="section">
        <h2>Why Teams Are Moving This Way</h2>
        <div class="grid two">
          <div class="card"><h3>Intent becomes executable</h3><p>GitHub's Spec Kit describes the shift as moving from code-first prompts to specs that directly drive implementation. Compass follows the same premise: the durable artifact should be the source of truth, not the last chat turn.</p></div>
          <div class="card"><h3>The workflow becomes reusable</h3><p>Superpowers frames agentic development as composable skills: brainstorm first, write plans, use subagents, enforce TDD, request review, and verify before finishing. Compass applies that discipline through explicit <code>/kiro:*</code> commands.</p></div>
          <div class="card"><h3>Existing code gets a voice</h3><p>Spec-driven work is strongest when it records how the change touches the current system. Discovery, gap validation, and design validation keep the plan from becoming a greenfield fantasy.</p></div>
          <div class="card"><h3>Ceremony is right-sized</h3><p>One workflow does not fit every change. Compass keeps the full path for risky behavior and offers <code>/kiro:spec-quick</code> plus <code>/kiro:impl-fast</code> when the work is small enough.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>What Changes</h2>
        <div class="grid two">
          <div class="card"><h3>Same task, same input</h3><p>Without a spec, two people can ask for the same change and get two different implementations. A spec gives the agent the same source of truth across sessions and teammates.</p></div>
          <div class="card"><h3>Review happens earlier</h3><p>A tech lead can review requirements and design before a large diff exists. The cheapest time to fix scope, data flow, and edge cases is before implementation.</p></div>
          <div class="card"><h3>Standards stop living in memory</h3><p>Steering files capture product, tech, structure, and team rules once. Future specs and implementation runs can reuse those rules instead of rediscovering them.</p></div>
          <div class="card"><h3>The last 40% moves forward</h3><p>The grind of correcting style, conventions, missed constraints, and repo-specific behavior is handled during discovery, design, and tasks rather than after generated code drifts.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>How Compass Makes It Practical</h2>
        <table>
          <thead><tr><th>Risk</th><th>Compass response</th></tr></thead>
          <tbody>
            <tr><td>The agent guesses scope from a rough ask.</td><td><code>/kiro:discovery</code> turns the ask into a brief, asks useful questions, and decides whether this needs a spec, an existing spec, or no spec.</td></tr>
            <tr><td>The agent misses repository conventions.</td><td><code>/kiro:steering</code> writes durable project memory before feature work begins.</td></tr>
            <tr><td>The design sounds right but ignores real code.</td><td><code>/kiro:validate-design</code> checks design claims against local implementation evidence before tasks.</td></tr>
            <tr><td>Implementation drifts from the plan.</td><td><code>/kiro:impl</code>, review, and <code>/kiro:validate-impl</code> keep code tied back to approved tasks.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Brownfield Confidence Loop</h2>
        <ol>
          <li><strong>Start with discovery.</strong> It disambiguates names, boundaries, and whether the work belongs in a new spec, an existing spec, or a direct cosmetic edit.</li>
          <li><strong>Write or refresh steering.</strong> Product, tech, structure, and custom rules become repository memory that every later phase loads.</li>
          <li><strong>Validate the gap.</strong> For existing systems, <code>/kiro:validate-gap</code> checks what already exists before design commits to a path.</li>
          <li><strong>Review design before code.</strong> <code>/kiro:validate-design</code> looks for missing contracts, vague boundaries, and repo-inconsistent architecture while the diff is still zero.</li>
          <li><strong>Gate implementation with evidence.</strong> <code>/kiro:impl</code> uses RED/GREEN milestones and <code>/kiro:validate-impl</code> catches cross-task drift before merge.</li>
        </ol>
      </section>
      <section class="section">
        <h2>Public Signals</h2>
        <table>
          <thead><tr><th>Source</th><th>Useful takeaway</th></tr></thead>
          <tbody>
            <tr><td><a href="https://github.github.com/spec-kit/concepts/sdd.html">GitHub Spec Kit: What is SDD?</a></td><td>Specs define the what before the how, with multi-step refinement instead of one-shot generation.</td></tr>
            <tr><td><a href="https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/">GitHub Blog: Spec-driven development with AI</a></td><td>Feature work in existing systems is a strong fit because specs force clarity on how new behavior interacts with current architecture.</td></tr>
            <tr><td><a href="https://github.com/obra/superpowers">Superpowers</a></td><td>Strong agent workflows combine brainstorming, planning, TDD, subagents, review, and verification rather than relying on raw prompting.</td></tr>
            <tr><td><a href="https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html">Martin Fowler: Kiro, Spec Kit, and Tessl</a></td><td>SDD tools need right-sized workflows; too much documentation for a tiny change can be worse than a smaller controlled path.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>When It Is Worth It</h2>
        <p>Use the full spec path for behavior changes, cross-file work, data model changes, payments, auth, migrations, integrations, or anything you would dislike debugging from a 2,000-line generated diff. For tiny low-risk work, use <code>/kiro:spec-quick</code> so the ceremony matches the risk.</p>
        <div class="actions inline">
          <a class="button primary" href="#first-10-minutes">Start the first run</a>
          <a class="button" href="#steering">Learn steering</a>
          <a class="button" href="#command-chooser">Pick a command</a>
        </div>
      </section>
    `
  },
  {
    group: "Get Started",
    id: "what-sets-compass-apart",
    title: "What Sets Compass Apart",
    summary: "Seven design choices that make Compass different from prompting raw or using generic AI workflows.",
    badges: ["Core", "Why"],
    content: `
      <section class="section">
        <h1>What Sets Compass Apart</h1>
        <p>Most AI coding tools stop at "prompt → diff." Compass is built around a different thesis: the hard part isn't generating code — it's keeping intent, decisions, and lessons visible across sessions, teammates, and months of evolution. These seven design choices are what make it work.</p>
      </section>

      <section class="section">
        <h2>1. Learnings Compound Across Specs and Teammates</h2>
        <p>When you correct the AI — wrong design choice, missed constraint, bad architectural call — Compass doesn't just fix this session. It <strong>records</strong> the correction in the spec's <code>learnings.md</code>, and if the pattern is reusable, <strong>promotes</strong> it to a global <code>patterns.md</code> file.</p>
        <p>19 of 24 skills load that file as context. So your correction today shapes how the AI designs, implements, and reviews the <em>next</em> feature — even if a different teammate runs it in a different session weeks later.</p>
        <p>Three capture paths make sure nothing slips through: in-skill capture during <a href="#review">review</a> and <a href="#debug">debug</a>, a background hook that catches corrections between skill runs, and <a href="#retrospective">retrospective</a> interviews.</p>
        <div class="callout"><a href="#learning-loop">Deep dive: Auto-Learning Loop →</a></div>
      </section>

      <section class="section">
        <h2>2. Design Splits into HLD and LLD</h2>
        <p>Most tools produce one design document. Compass splits it into two deliberate phases:</p>
        <ul>
          <li><strong>HLD</strong> (High-Level Design): architecture, component boundaries, data flows, integration points. This is where you and the AI argue about the <em>shape</em> of the solution. Cheap in tokens, fast to iterate, easy to course-correct.</li>
          <li><strong>LLD</strong> (Low-Level Design): interfaces, data models, API contracts, error handling. This only starts after HLD is approved.</li>
        </ul>
        <p>The split saves tokens (no detailed interface specs for an architecture that's going to change) and saves time (HLD review catches structural mistakes before you're deep in implementation details).</p>
        <p>A ruthless <a href="#gates">architect-critique loop</a> stress-tests the HLD with pointed questions about edge cases, failure modes, and blast radius — grounded in your actual codebase, not generic advice.</p>
        <div class="callout"><a href="#specifications">How specs work →</a> · Commands: <a href="#spec-design-hld"><code>/kiro:spec-design-hld</code></a>, <a href="#spec-design-lld"><code>/kiro:spec-design-lld</code></a></div>
      </section>

      <section class="section">
        <h2>3. Discovery Surfaces Unknowns Before You Commit</h2>
        <p><a href="#discovery"><code>/kiro:discovery</code></a> is not a prompt rewriter. It runs a deep codebase exploration and Q&amp;A loop that finds the unknowns in your approach:</p>
        <ul>
          <li>What already exists that overlaps with what you're building?</li>
          <li>What adjacent systems will your change touch?</li>
          <li>What assumptions are you making that the code contradicts?</li>
          <li>Is this actually one feature, or three?</li>
        </ul>
        <p>The questions it asks are the ones you'd forget to ask yourself. The output is a scoped brief that routes to the right workflow — no spec, quick spec, full spec, or multi-spec roadmap.</p>
        <div class="callout"><a href="#discovery-brainstorm-qna">Discovery, Brainstorm, and Q&amp;A →</a></div>
      </section>

      <section class="section">
        <h2>4. Triage Decides Spec Depth, Not You</h2>
        <p>Engineers misjudge scope. A "quick fix" turns into a cross-cutting change; a "big feature" turns out to be a config tweak. Compass classifies automatically:</p>
        <table>
          <thead><tr><th>Classification</th><th>What happens</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td><strong>No spec</strong></td><td>Discovery routes to direct action</td><td>Typo fix, version bump</td></tr>
            <tr><td><strong>Minimal spec</strong></td><td>One model turn, no design phase, no gates</td><td>Add a config flag, rename an endpoint</td></tr>
            <tr><td><strong>Standard spec</strong></td><td>Requirements → Design (if warranted) → Tasks</td><td>New API endpoint, refactor a service</td></tr>
            <tr><td><strong>Multi-spec</strong></td><td>Roadmap with dependency waves</td><td>Platform migration, new product vertical</td></tr>
          </tbody>
        </table>
        <p>Override when you want, but the default is evidence-based. <a href="#command-chooser">The command chooser</a> walks you through the same logic interactively.</p>
      </section>

      <section class="section">
        <h2>5. Validation Gates Catch Drift Before It Ships</h2>
        <p>AI implementations can be flaky. Tests pass but the code doesn't match the spec. A design assumption gets silently dropped. A boundary stated in requirements is ignored in implementation.</p>
        <p>Compass has three layers of validation:</p>
        <ul>
          <li><strong>Per-task review</strong> (<a href="#review"><code>/kiro:review</code></a>): checks each task against its spec boundaries and catches security, correctness, and scope issues.</li>
          <li><strong>Feature-level validation</strong> (<a href="#validate-impl"><code>/kiro:validate-impl</code></a>): cross-checks all tasks together, runs the full test suite, verifies the spec's acceptance criteria end-to-end.</li>
          <li><strong>Completion gate</strong> (<a href="#kiro-next"><code>/kiro:verify-completion</code></a>): requires fresh build/test evidence before "done." Self-reported status is never trusted alone.</li>
        </ul>
        <div class="callout"><a href="#gates">How gates work →</a></div>
      </section>

      <section class="section">
        <h2>6. Idea to Approved HLD in Minutes</h2>
        <p>The path from a rough idea to a reviewed, approved high-level design is short:</p>
        <ol>
          <li><strong>Discovery</strong> scopes the work — explores the codebase, asks questions, produces a brief.</li>
          <li><strong>Requirements</strong> capture intent in <a href="#specifications">EARS format</a> — observable behaviors, not implementation instructions.</li>
          <li><strong>HLD</strong> designs the architecture — the architect-critique loop stress-tests it with pointed questions grounded in your actual code.</li>
        </ol>
        <p>Each step is grounded in local evidence (<a href="#steering">steering</a> + codebase reads), not generic architecture advice. The result is an HLD your team can review in 5 minutes and an engineer can implement from.</p>
      </section>

      <section class="section">
        <h2>7. Every Step Tells You the Next One</h2>
        <p>24 commands sounds like a lot. In practice, you rarely think about them.</p>
        <ul>
          <li><a href="#discovery"><code>/kiro:discovery</code></a> routes you to the right starting point based on what you describe.</li>
          <li><a href="#kiro-next"><code>/kiro:next</code></a> reads your spec state and prints the exact next command — which phase you're in, what's done, what's blocking.</li>
          <li><a href="#spec-status"><code>/kiro:spec-status</code></a> gives the full picture when you need more detail.</li>
        </ul>
        <p>The workflow is self-navigating. Most sessions use 3–5 commands. You don't need to memorize the list.</p>
        <div class="actions inline">
          <a class="button primary" href="#quick-install">Install Compass</a>
          <a class="button" href="#first-10-minutes">First 10 minutes</a>
          <a class="button" href="#command-chooser">Which command should I run?</a>
        </div>
      </section>
    `
  },
  {
    group: "Get Started",
    id: "quick-install",
    title: "Quick Install",
    summary: "Install Compass from the release branch and verify it with doctor.",
    badges: ["Setup"],
    content: `
      <section class="section">
        <h1>Quick Install</h1>
        <p>Install the generated release branch as a Claude Code marketplace source, then verify the plugin.</p>
        <pre><code>/plugin marketplace add scapia-oss/compass@release
/plugin install kiro@kiro-compass
/reload-plugins
/kiro:doctor</code></pre>
        <div class="callout"><strong>Expected result:</strong> <code>/kiro:doctor</code> reports the installed plugin version and checks the bundled hooks, settings, commands, and scripts.</div>
      </section>
      <section class="section">
        <h2>If Marketplace Add Fails</h2>
        <ol>
          <li>Confirm your Claude Code version supports plugin marketplaces.</li>
          <li>Try a local checkout of the <code>release</code> branch and add that path.</li>
          <li>Run <code>/plugin marketplace list</code> and remove stale entries before retrying.</li>
        </ol>
      </section>
    `
  },
  {
    group: "Get Started",
    id: "first-10-minutes",
    title: "First 10 Minutes",
    summary: "A first-run path that teaches Compass the repository before asking it to build.",
    badges: ["Setup", "Steering"],
    content: `
      <section class="section">
        <h1>First 10 Minutes</h1>
        <p>Start by proving the plugin works, then write steering files. Steering is the foundation for every later spec and implementation run.</p>
        <pre><code>/kiro:doctor
/kiro:steering
/kiro:discovery "Add the change you want"
/kiro:spec-status &lt;feature&gt;</code></pre>
      </section>
      <section class="section">
        <h2>Why Steering Comes Early</h2>
        <div class="grid">
          <div class="card"><h3><code>product.md</code></h3><p>What the project does, who it serves, and what outcomes matter.</p></div>
          <div class="card"><h3><code>tech.md</code></h3><p>Runtime, frameworks, build commands, tests, and technical constraints.</p></div>
          <div class="card"><h3><code>structure.md</code></h3><p>Where code lives, naming patterns, module boundaries, and file ownership.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>Good First Test</h2>
        <p>Ask Compass to explain what it loaded after steering exists. If the answer names real repo files and conventions, you are ready for a spec.</p>
      </section>
    `
  },
  {
    group: "Get Started",
    id: "command-chooser",
    title: "Which Command Should I Run?",
    summary: "A practical decision tree for choosing the next Compass command.",
    badges: ["Guide"],
    content: `
      <section class="section">
        <h1>Which Command Should I Run?</h1>
        <table>
          <thead><tr><th>Question</th><th>If yes</th><th>If no</th></tr></thead>
          <tbody>
            <tr><td>Is Compass installed and working?</td><td>Continue</td><td><code>/kiro:doctor</code></td></tr>
            <tr><td>Is this the first Compass run in this repo?</td><td><code>/kiro:steering</code></td><td>Continue</td></tr>
            <tr><td>Is the request rough, ambiguous, or still a brainstorm?</td><td><code>/kiro:discovery "..."</code></td><td>Continue</td></tr>
            <tr><td>Is this tiny and low-risk?</td><td><code>/kiro:spec-quick "..."</code></td><td><code>/kiro:spec-init "..."</code></td></tr>
            <tr><td>Do you already have a spec?</td><td><code>/kiro:spec-status &lt;feature&gt;</code></td><td><code>/kiro:spec-init "..."</code></td></tr>
            <tr><td>Are tasks approved?</td><td><code>/kiro:impl &lt;feature&gt;</code></td><td><code>/kiro:spec-tasks &lt;feature&gt;</code></td></tr>
            <tr><td>Is the implementation stuck?</td><td><code>/kiro:debug "failure summary"</code></td><td><code>/kiro:validate-impl &lt;feature&gt;</code></td></tr>
            <tr><td>Lost, or forget which feature you were on?</td><td><code>/kiro:next</code></td><td>Continue</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Get Started",
    id: "cheat-sheet",
    title: "Cheat Sheet",
    summary: "Copyable commands for common Compass flows.",
    badges: ["Reference"],
    content: `
      <section class="section">
        <h1>Cheat Sheet</h1>
        <h2>Install</h2>
        <pre><code>/plugin marketplace add scapia-oss/compass@release
/plugin install kiro@kiro-compass
/reload-plugins
/kiro:doctor</code></pre>
        <h2>New Feature</h2>
        <pre><code>/kiro:steering
/kiro:discovery "..."
/kiro:spec-init "..."
/kiro:spec-requirements &lt;feature&gt;
/kiro:spec-design &lt;feature&gt;
/kiro:spec-tasks &lt;feature&gt;
/kiro:impl &lt;feature&gt;
/kiro:validate-impl &lt;feature&gt;</code></pre>
        <h2>Small Change</h2>
        <pre><code>/kiro:spec-quick "..." --auto
/kiro:impl-fast &lt;feature&gt; --validate</code></pre>
        <h2>Debug</h2>
        <pre><code>/kiro:debug "failure summary"
/kiro:validate-impl &lt;feature&gt;</code></pre>
        <h2>Lost?</h2>
        <pre><code>/kiro:next</code></pre>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "core-concepts",
    title: "Core Concepts",
    summary: "The mental model: steering, specs, gates, local evidence, and command handoffs.",
    badges: ["Concept"],
    content: `
      <section class="section">
        <h1>Core Concepts</h1>
        <div class="grid two">
          <div class="card"><h3>Steering</h3><p>Project-wide memory. It tells Compass what this repository is and how work should fit.</p></div>
          <div class="card"><h3>Specifications</h3><p>Feature-scoped records under <code>.kiro/specs/</code>. They hold requirements, design, tasks, validation, and decisions.</p></div>
          <div class="card"><h3>Gates</h3><p>Human checkpoints before requirements, design, tasks, and implementation move forward.</p></div>
          <div class="card"><h3>Local-first grounding</h3><p>Compass should read local code and steering before it proposes design or implementation.</p></div>
          <div class="card"><h3>Model roles</h3><p>Use the higher-capability session model for discovery, design, orchestration, review, debug, and validation. Implementation writing defaults to a Sonnet-class subagent for cost-effective execution.</p></div>
          <div class="card"><h3>Parent-witness gates</h3><p>The main context does not blindly trust a writer subagent. It witnesses RED/GREEN evidence, checks grounding, and owns completion claims.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>Lifecycle</h2>
        <div class="flow">
          <div class="flow-step"><strong>Requirements</strong>Agree on what changes.</div>
          <div class="flow-step"><strong>Design</strong>Agree on how it fits.</div>
          <div class="flow-step"><strong>Tasks</strong>Agree on executable steps.</div>
          <div class="flow-step"><strong>Implementation</strong>Build, review, validate, learn.</div>
        </div>
        <p>New to the method? Read <a href="#why-sdd">Why Spec-Driven Development?</a> before choosing a workflow.</p>
        <p>Compass follows the same broad spec-first spirit popularized by <a href="https://kiro.dev/">AWS Kiro IDE</a>, then adds Claude Code-specific command workflows for discovery, steering, implementation, validation, and learning.</p>
        <p>For model choice, read <a href="#model-policy">Model Policy</a>. The short version: spend the strongest reasoning on intent, architecture, gates, and review; use implementation subagents for bounded code-writing work.</p>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "model-policy",
    title: "Model Policy",
    summary: "Where Compass uses the higher session model and where implementation subagents write code.",
    badges: ["Concept", "Implementation"],
    content: `
      <section class="section">
        <h1>Model Policy</h1>
        <p>Compass separates reasoning roles from writing roles. The exact model names depend on your Claude Code environment, but the policy is stable: the main session should carry the high-context thinking, and implementation writing should run in bounded subagents by default.</p>
        <div class="callout"><strong>Default stance:</strong> run discovery, requirements, design, task synthesis, orchestration, review, debug, and validation on the higher-capability session model. Let implementation use a Sonnet-class writer unless you explicitly opt into the higher model with <code>--impl-model opus</code>.</div>
      </section>
      <section class="section">
        <h2>Role Split</h2>
        <table>
          <thead><tr><th>Role</th><th>Default model placement</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>Discovery and Q&A</td><td>Higher-capability session model</td><td>This is where ambiguity, scope, and tradeoffs are found. Bad answers here poison every later artifact.</td></tr>
            <tr><td>Requirements, HLD, LLD, tasks</td><td>Higher-capability session model</td><td>These phases need broad repo context, architectural judgment, and clear human-review artifacts.</td></tr>
            <tr><td><code>/kiro:impl</code> code writing</td><td>Fresh Sonnet-class implementer subagent per non-trivial milestone by default</td><td>The task is bounded by approved spec excerpts, steering, design globals, test guidance, and validation commands.</td></tr>
            <tr><td><code>/kiro:impl-fast</code> code writing</td><td>Single Sonnet-class implementer pass by default</td><td>Fast path batches small low-risk work while preserving one end gate.</td></tr>
            <tr><td>Review, debug, validation, completion claims</td><td>Higher-capability session model</td><td>The parent context owns quality gates, fresh evidence, and whether the work can be called done.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>How To Signal It</h2>
        <pre><code>/kiro:impl checkout-notification-preferences
/kiro:impl checkout-notification-preferences --impl-model opus
/kiro:impl-fast empty-display-name-validation --validate
/kiro:impl-fast empty-display-name-validation --impl-model opus --validate</code></pre>
        <ul>
          <li>Use the default for normal work: higher model orchestrates; Sonnet-class subagent writes bounded code.</li>
          <li>Add <code>--impl-model opus</code> when the implementation itself needs maximum reasoning: delicate algorithms, high-risk migrations, hard concurrency, security-sensitive code, or repeated Sonnet drift.</li>
          <li>Use <code>--review required</code> with <code>/kiro:impl</code> when you also want a fresh reviewer subagent per milestone.</li>
          <li>Do not downgrade discovery or design to save cost. These phases decide what will be built.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "steering",
    title: "Steering",
    summary: "Bootstrap repository memory before feature work begins.",
    badges: ["Steering", "Setup"],
    content: `
      <section class="section">
        <h1>Steering</h1>
        <p>Steering files are the first durable context Compass should create in a repository. They are not exhaustive docs; they are the rules and facts the agent must keep using.</p>
        <pre><code>/kiro:steering
/kiro:steering-custom</code></pre>
      </section>
      <section class="section">
        <h2>Default Files</h2>
        <table>
          <thead><tr><th>File</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>.kiro/steering/product.md</code></td><td>Purpose, users, domain, and value proposition.</td></tr>
            <tr><td><code>.kiro/steering/tech.md</code></td><td>Stack, build/test commands, runtime constraints, dependencies.</td></tr>
            <tr><td><code>.kiro/steering/structure.md</code></td><td>Directory layout, module boundaries, naming, ownership patterns.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Custom Steering</h2>
        <p>Use custom steering for durable team or subsystem rules: API standards, security expectations, data access rules, UI conventions, or testing policy.</p>
        <div class="callout warn"><strong>Keep it durable.</strong> Do not put one feature's implementation note into steering. Put feature-specific decisions in the spec.</div>
      </section>
    `
  },
  {
    group: "Guides",
    id: "new-feature-workflow",
    title: "New Feature Workflow",
    summary: "The normal path for meaningful behavior changes.",
    badges: ["Spec", "Guide"],
    content: `
      <section class="section">
        <h1>New Feature Workflow</h1>
        <pre><code>/kiro:steering
/kiro:discovery "..."
/kiro:spec-init "..."
/kiro:spec-requirements &lt;feature&gt;
/kiro:spec-design &lt;feature&gt;
/kiro:validate-design &lt;feature&gt;
/kiro:spec-tasks &lt;feature&gt;
/kiro:impl &lt;feature&gt;
/kiro:validate-impl &lt;feature&gt;
/kiro:retrospective &lt;feature&gt;</code></pre>
        <div class="callout"><strong>Use this when:</strong> the change affects behavior, contracts, data, state, or multiple files that future maintainers need to understand.</div>
      </section>
    `
  },
  {
    group: "Guides",
    id: "small-change-workflow",
    title: "Small Change Workflow",
    summary: "Use spec-quick and impl-fast for low-risk scoped changes.",
    badges: ["Guide", "Implementation"],
    content: `
      <section class="section">
        <h1>Small Change Workflow</h1>
        <pre><code>/kiro:spec-quick "Add validation for empty display name" --auto
/kiro:impl-fast &lt;feature&gt; --validate</code></pre>
      </section>
      <section class="section">
        <h2>When It Fits</h2>
        <ul>
          <li>The change is small and bounded.</li>
          <li>No public contract, auth, money, migration, or concurrency risk is involved.</li>
          <li>A compact spec is enough to preserve intent.</li>
        </ul>
      </section>
      <section class="section">
        <h2><code>/kiro:impl</code> vs <code>/kiro:impl-fast</code></h2>
        <table>
          <thead><tr><th>Command</th><th>Use when</th><th>Gate shape</th></tr></thead>
          <tbody>
            <tr><td><code>/kiro:impl</code></td><td>Approved tasks need normal autonomous implementation.</td><td>Task dispatch, review, validation, and final checks.</td></tr>
            <tr><td><code>/kiro:impl-fast</code></td><td>The work is small enough that the full loop is more ceremony than value.</td><td>Lighter implementation path with focused verification.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Command Reference",
    id: "doctor",
    title: "/kiro:doctor",
    summary: "Diagnose plugin installation and repo setup.",
    badges: ["Setup"],
    content: `
      <section class="section">
        <h1>/kiro:doctor</h1>
        <p>Run this after install, update, rollback, or whenever commands or hooks do not behave as expected.</p>
        <pre><code>/kiro:doctor</code></pre>
        <h2>What It Checks</h2>
        <ul>
          <li>Installed plugin version.</li>
          <li>Bundled scripts and hooks.</li>
          <li>Settings and command availability.</li>
          <li>Common stale-install symptoms.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Command Reference",
    id: "discovery",
    title: "/kiro:discovery",
    summary: "The brainstorm and Q&A loop that clarifies intent before Compass chooses a path.",
    badges: ["Spec", "Discovery"],
    content: `
      <section class="section">
        <h1>/kiro:discovery</h1>
        <p>Use discovery when the request is rough, broad, cross-cutting, or still forming. This is where Compass turns a one-line idea into a scoped direction before it writes requirements, design, or tasks.</p>
        <pre><code>/kiro:discovery "Add notification preferences for checkout updates"</code></pre>
        <div class="callout"><strong>Why teams value it:</strong> discovery is not ceremony. It is the brainstorm loop that catches hidden scope, conflicting meanings, missing actors, and "we are talking about two different features" before the spec starts.</div>
      </section>
      <section class="section">
        <h2>What Makes Discovery Different</h2>
        <div class="grid two">
          <div class="card"><h3>It asks before it writes</h3><p>Discovery uses a Q&A loop to clarify the smallest useful set of decisions. Good questions replace long speculative documents.</p></div>
          <div class="card"><h3>It sizes the work</h3><p>Some ideas need a full spec. Some need <code>/kiro:spec-quick</code>. Some need a roadmap. Some should not become a spec at all.</p></div>
          <div class="card"><h3>It preserves the brainstorm</h3><p>The useful parts of the conversation become durable context, so the next command does not ask you to repeat yourself.</p></div>
          <div class="card"><h3>It prevents early anchoring</h3><p>The agent is not allowed to jump straight to implementation details before product intent and boundaries are clear.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>The Q&A Loop</h2>
        <table>
          <thead><tr><th>Discovery asks about</th><th>Why it matters</th></tr></thead>
          <tbody>
            <tr><td>Actors and user journeys</td><td>Prevents requirements from describing only the happy path.</td></tr>
            <tr><td>Boundaries and non-goals</td><td>Stops adjacent features from quietly entering the scope.</td></tr>
            <tr><td>Existing behavior</td><td>Separates new work from bugfixes, migrations, and cleanup.</td></tr>
            <tr><td>Risk areas</td><td>Flags auth, payments, data integrity, notifications, concurrency, and cross-service impact early.</td></tr>
            <tr><td>Decision owners</td><td>Identifies what needs human approval before the spec proceeds.</td></tr>
          </tbody>
        </table>
        <div class="callout warn"><strong>Do not skip it for unclear work.</strong> Skip discovery and you are asking the agent to guess the scope. The rest of the workflow inherits that guess.</div>
      </section>
      <section class="section">
        <h2>What It Produces</h2>
        <ul>
          <li>A clarified problem statement and recommended next command.</li>
          <li>A brief for focused spec work when the idea is ready.</li>
          <li>A roadmap when one idea should split into multiple specs.</li>
          <li>A record of assumptions, open questions, and explicit non-goals.</li>
        </ul>
        <h2>Next Command</h2>
        <table>
          <thead><tr><th>Discovery outcome</th><th>Run next</th></tr></thead>
          <tbody>
            <tr><td>Small, bounded, low-risk change</td><td><code>/kiro:spec-quick "..."</code></td></tr>
            <tr><td>Meaningful new behavior</td><td><code>/kiro:spec-init "..."</code></td></tr>
            <tr><td>Multiple related features</td><td><code>/kiro:spec-batch</code></td></tr>
            <tr><td>Existing spec already covers it</td><td><code>/kiro:spec-status &lt;feature&gt;</code></td></tr>
          </tbody>
        </table>
        <div class="callout"><strong>Discovery does not implement.</strong> It routes the work and records context so the next command can continue.</div>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "discovery-brainstorm-qna",
    title: "Discovery, Brainstorm, and Q&A",
    summary: "Why the first conversation is often the most valuable part of Compass.",
    badges: ["Discovery", "Guide"],
    content: `
      <section class="section">
        <h1>Discovery, Brainstorm, and Q&A</h1>
        <p>The discovery step is where Compass earns trust early. It does not treat your first sentence as a complete ticket. It treats it as the start of a short product and engineering conversation.</p>
        <div class="callout"><strong>Field learning:</strong> the Q&A loop is useful because it catches mismatched vocabulary, missing edge cases, and hidden dependency work before anyone writes requirements or code.</div>
      </section>
      <section class="section">
        <h2>What A Good Discovery Session Feels Like</h2>
        <div class="grid two">
          <div class="card"><h3>Short questions</h3><p>The agent asks only questions that change scope, risk, or next action.</p></div>
          <div class="card"><h3>Concrete options</h3><p>When the path is unclear, Compass should present tradeoffs instead of asking open-ended essay questions.</p></div>
          <div class="card"><h3>Repo-aware framing</h3><p>Discovery should use steering and visible repo facts when available, then mark unknowns explicitly.</p></div>
          <div class="card"><h3>No premature design</h3><p>It should not jump to APIs, tables, or files until the outcome and boundary are understood.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>Example Loop</h2>
        <pre><code>/kiro:discovery "Let users control checkout notifications"</code></pre>
        <table>
          <thead><tr><th>Question</th><th>Why it is useful</th></tr></thead>
          <tbody>
            <tr><td>Which users can change the preference?</td><td>Separates customer settings from ops/admin controls.</td></tr>
            <tr><td>Which channels are in scope?</td><td>Prevents email, SMS, push, and WhatsApp from being mixed accidentally.</td></tr>
            <tr><td>Should existing users get a default?</td><td>Surfaces migration, consent, and backwards compatibility.</td></tr>
            <tr><td>Where should the preference be enforced?</td><td>Finds whether this is UI-only, backend-only, or cross-service.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Signals Discovery Worked</h2>
        <ul>
          <li>You can state the change in one or two precise sentences.</li>
          <li>Non-goals are explicit.</li>
          <li>The next command is obvious.</li>
          <li>The spec does not have to rediscover the same context.</li>
          <li>Reviewers can see which assumptions came from the conversation.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "lifecycle",
    title: "Lifecycle",
    summary: "How an idea moves from discovery to implementation, validation, and learning.",
    badges: ["Concept"],
    content: `
      <section class="section">
        <h1>Lifecycle</h1>
        <p>Compass is intentionally phase-based. Each phase creates an artifact that the next phase can read, review, and validate.</p>
        <div class="flow">
          <div class="flow-step"><strong>Discover</strong><code>/kiro:discovery</code><br>clarify and route</div>
          <div class="flow-step"><strong>Specify</strong>requirements<br>design<br>tasks</div>
          <div class="flow-step"><strong>Implement</strong><code>/kiro:impl</code><br><code>/kiro:impl-fast</code></div>
          <div class="flow-step"><strong>Validate</strong><code>/kiro:validate-impl</code><br><code>/kiro:retrospective</code></div>
        </div>
      </section>
      <section class="section">
        <h2>Approval Gates</h2>
        <table>
          <thead><tr><th>Gate</th><th>Question it answers</th></tr></thead>
          <tbody>
            <tr><td>Requirements</td><td>Are we solving the right problem?</td></tr>
            <tr><td>Design</td><td>Does the approach fit the existing system?</td></tr>
            <tr><td>Tasks</td><td>Can implementation proceed in clear, reviewable steps?</td></tr>
            <tr><td>Validation</td><td>Did the completed code satisfy the spec and tests?</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "specifications",
    title: "Specifications",
    summary: "What lives under .kiro/specs and how spec artifacts work together.",
    badges: ["Spec"],
    content: `
      <section class="section">
        <h1>Specifications</h1>
        <p>A specification is the durable record for one feature or change. It keeps the agent, reviewer, and implementer aligned across sessions.</p>
        <table>
          <thead><tr><th>Artifact</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>requirements.md</code></td><td>Behavior, constraints, acceptance criteria, and non-goals.</td></tr>
            <tr><td><code>design.md</code></td><td>Implementation approach, contracts, data flow, risks, and alternatives.</td></tr>
            <tr><td><code>tasks.md</code></td><td>Ordered implementation work with verification expectations.</td></tr>
            <tr><td><code>decisions.md</code></td><td>Important choices made during the spec lifecycle.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Good Specs Are Bounded</h2>
        <ul>
          <li>They name what is in scope and out of scope.</li>
          <li>They cite local evidence when design depends on existing code.</li>
          <li>They avoid implementation detail until the design phase.</li>
          <li>They preserve unresolved questions instead of hiding them.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "gates",
    title: "Gates",
    summary: "The review checkpoints that keep AI-assisted work from drifting.",
    badges: ["Validation"],
    content: `
      <section class="section">
        <h1>Gates</h1>
        <p>Gates are not red tape. They are small moments where humans can correct direction before the agent compounds a bad assumption.</p>
        <div class="grid two">
          <div class="card"><h3>Requirements gate</h3><p>Approve the outcome and acceptance criteria.</p></div>
          <div class="card"><h3>Design gate</h3><p>Approve the technical approach and blast radius.</p></div>
          <div class="card"><h3>Tasks gate</h3><p>Approve the execution plan before code starts.</p></div>
          <div class="card"><h3>Validation gate</h3><p>Confirm the final implementation matches the spec and evidence.</p></div>
        </div>
      </section>
      <section class="section">
        <h2>Fast Track Still Has A Gate</h2>
        <p><code>--auto</code> and <code>/kiro:impl-fast</code> are useful when risk is low, but they should still leave enough artifact trail for someone else to understand what changed and why.</p>
      </section>
    `
  },
  {
    group: "Learn Compass",
    id: "learning-loop",
    title: "Auto-Learning",
    summary: "How corrections become patterns that prevent the same mistake twice.",
    badges: ["Core", "Patterns"],
    content: `
      <section class="section">
        <h1>Auto-Learning Loop</h1>
        <p>When you correct the AI — wrong design choice, missed constraint, bad architectural call — Compass records the correction, promotes it to a reusable pattern, and loads it into future work. The AI doesn't repeat the same mistake twice in the same project.</p>
      </section>
      <section class="section">
        <h2>How It Works</h2>
        <div class="diagram">
          <pre>
┌──────────────────────────────────────────────┐
│           YOU CORRECT THE AI                 │
│  (approach / scope / architecture / choice)  │
└──────┬──────────────────┬─────────────┬──────┘
       │                  │             │
       ▼                  ▼             ▼
 ┌───────────┐   ┌──────────────┐  ┌────────────┐
 │  In-skill │   │  Feedback    │  │  Retro-    │
 │  capture  │   │  capture     │  │  spective  │
 │  (review/ │   │  hook        │  │            │
 │   debug)  │   │  (between    │  │            │
 │           │   │   skills)    │  │            │
 └─────┬─────┘   └──────┬───────┘  └────────────┘
       │                 │
       ▼                 ▼
 ┌────────────────────────────────────┐
 │  Per-spec learnings                │
 │  .kiro/specs/.../learnings.md      │
 │  AI output → correction            │
 │  → root cause → is it reusable?    │
 └──────────────┬─────────────────────┘
                │ generalizable + not covered?
                ▼
 ┌────────────────────────────────────┐
 │  Global patterns                   │
 │  .kiro/learnings/patterns.md       │
 │  append-only · validated · cited   │
 └──────────────┬─────────────────────┘
                │ loaded by 19 of 24 skills
                ▼
 ┌────────────────────────────────────┐
 │  Next spec / design / impl         │
 │  "Learning applied: P-3 → batch    │
 │   inventory calls in cart pricing"  │
 └────────────────────────────────────┘
          </pre>
        </div>
      </section>
      <section class="section">
        <h2>Three Entry Points</h2>
        <div class="grid">
          <div class="card">
            <h3>In-skill capture</h3>
            <p>During <code>/kiro:review</code> and <code>/kiro:debug</code>, if you override the AI's verdict — wrong design call, missed constraint, bad root cause — the skill records the correction to <code>learnings.md</code> immediately.</p>
            <p>Only directional corrections are recorded (approach, scope, architecture). Typos and formatting fixes are filtered out.</p>
          </div>
          <div class="card">
            <h3>Feedback-capture hook</h3>
            <p>Corrections often arrive <em>after</em> a skill finishes — you see the result, then tell the AI what was wrong. A background hook detects this and prompts recording, even when no skill is active.</p>
            <p>The hook is session-scoped and fail-open: on any uncertainty, it fires rather than risking a lost correction.</p>
          </div>
          <div class="card">
            <h3>Retrospective</h3>
            <p><code>/kiro:retrospective</code> runs a structured interview — what worked, what didn't, where friction was — producing a <code>feedback.md</code> (developer journey) and <code>skill-improvements.md</code> (plugin improvement backlog).</p>
          </div>
        </div>
      </section>
      <section class="section">
        <h2>Per-Spec to Global</h2>
        <p>Each correction lands in the spec's <code>learnings.md</code> first, with:</p>
        <ul>
          <li>What the AI produced</li>
          <li>What you corrected</li>
          <li>Root cause of the mistake</li>
          <li>Whether it's generalizable or spec-specific</li>
        </ul>
        <p>If the pattern is reusable beyond this one spec, it's <strong>promoted</strong> to <code>.kiro/learnings/patterns.md</code> — a global, <strong>append-only</strong> file.</p>
        <div class="callout">
          <strong>Append-only contract:</strong> Patterns are never deleted, reordered, or renumbered. New patterns get the next <code>P-N</code> number. A validation script (<code>validate-patterns-append-only.py</code>) enforces this against the base branch. Each pattern carries a back-pointer to the spec that discovered it.
        </div>
      </section>
      <section class="section">
        <h2>How Patterns Influence Future Work</h2>
        <p>19 of 24 skills load <code>patterns.md</code> as context — discovery, all spec phases, design, implementation, review, debug, and validation. When a loaded pattern affects a decision, the skill cites it:</p>
        <pre><code>Learning applied: .kiro/learnings/patterns.md:42 — P-3 "Batch inventory calls" → used batch API in cart pricing</code></pre>
        <p>Over weeks and sessions, patterns accumulate into a project-specific knowledge base. Every new spec benefits from every past correction — even corrections made by different team members in different sessions.</p>
      </section>
      <section class="section">
        <h2>Example Flow</h2>
        <ol>
          <li><strong>Session 1:</strong> During <code>/kiro:review</code>, you correct the AI: "Don't use fire-and-forget for message delivery — downstream providers can fail silently. Use a DLQ with retry."</li>
          <li>The correction is recorded in <code>learnings.md</code> with root cause: "AI assumed synchronous delivery was reliable."</li>
          <li>The pattern is generalizable → promoted to <code>patterns.md</code> as <code>P-4: "Async delivery needs DLQ + retry"</code>.</li>
          <li><strong>Session 2:</strong> A different feature touches email notifications. During <code>/kiro:spec-design</code>, the AI loads P-4 and designs with a retry queue from the start.</li>
          <li>The design cites: <code>Learning applied: P-4 → designed retry queue for email delivery</code>.</li>
        </ol>
      </section>
    `
  },
  {
    group: "Guides",
    id: "bugfix-debug-workflow",
    title: "Bugfix and Debug Workflow",
    summary: "Find root cause first, then turn the confirmed fix into scoped work.",
    badges: ["Guide", "Debug"],
    content: `
      <section class="section">
        <h1>Bugfix and Debug Workflow</h1>
        <p>Use this when a test fails, validation fails, or the implementation is stuck. The rule is simple: debug from evidence before patching from guesses.</p>
        <pre><code>/kiro:debug "Checkout notification test fails with duplicate event delivery"
/kiro:spec-quick "Fix duplicate checkout notification delivery" --auto
/kiro:impl &lt;feature&gt;
/kiro:validate-impl &lt;feature&gt;</code></pre>
      </section>
      <section class="section">
        <h2>Good Debug Output</h2>
        <ul>
          <li>Names the failing command, test, or observed behavior.</li>
          <li>Separates symptom from root cause.</li>
          <li>Identifies the smallest code path that must change.</li>
          <li>Suggests verification that would catch the regression again.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Guides",
    id: "design-review-workflow",
    title: "Design Review Workflow",
    summary: "Use validate-design before tasks to catch impossible or under-grounded plans.",
    badges: ["Design", "Validation"],
    content: `
      <section class="section">
        <h1>Design Review Workflow</h1>
        <p>Run design validation before tasks for meaningful changes. This is where Compass should challenge the design against the actual repository instead of accepting a polished plan at face value.</p>
        <pre><code>/kiro:spec-design &lt;feature&gt;
/kiro:validate-design &lt;feature&gt;
/kiro:spec-tasks &lt;feature&gt;</code></pre>
      </section>
      <section class="section">
        <h2>What It Should Catch</h2>
        <table>
          <thead><tr><th>Check</th><th>Why it matters</th></tr></thead>
          <tbody>
            <tr><td>Real caller behavior</td><td>Designs often assume APIs fail or return data in ways they do not.</td></tr>
            <tr><td>Contract drift</td><td>Backend, UI, storage, and events must agree.</td></tr>
            <tr><td>Blast radius</td><td>Small-looking changes can affect jobs, notifications, retries, or reporting.</td></tr>
            <tr><td>Failure paths</td><td>Error handling must be designed, not discovered during implementation.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Guides",
    id: "implementation-workflow",
    title: "Implementation Workflow",
    summary: "How to move from approved tasks to code, review, validation, and retrospective.",
    badges: ["Implementation"],
    content: `
      <section class="section">
        <h1>Implementation Workflow</h1>
        <pre><code>/kiro:spec-status &lt;feature&gt;
/kiro:impl &lt;feature&gt;
/kiro:validate-impl &lt;feature&gt;
/kiro:retrospective &lt;feature&gt;</code></pre>
        <p>Start with status when returning to a spec. It tells you whether requirements, design, and tasks are ready for implementation.</p>
      </section>
      <section class="section">
        <h2>Before You Run Implementation</h2>
        <ul>
          <li>Tasks are approved.</li>
          <li>Open design questions are closed or explicitly deferred.</li>
          <li>Verification expectations are present in the task list.</li>
          <li>Steering is current enough for the agent to follow repo conventions.</li>
        </ul>
      </section>
      <section class="section">
        <h2>Model Split</h2>
        <p>The implementation phase deliberately separates orchestration from writing. The main session keeps the approved spec, design, steering, task queue, review mode, and validation state in view. Code writing defaults to a Sonnet-class implementer subagent with a bounded task brief.</p>
        <table>
          <thead><tr><th>Decision</th><th>Default</th><th>Escalate when</th></tr></thead>
          <tbody>
            <tr><td>Planning, dispatch, review, debug, validation</td><td>Higher-capability session model</td><td>Keep this as the default for all meaningful work.</td></tr>
            <tr><td>Implementation writer</td><td>Sonnet-class subagent via <code>/kiro:impl &lt;feature&gt;</code></td><td>Use <code>--impl-model opus</code> for high-risk implementation logic.</td></tr>
            <tr><td>Fast implementation writer</td><td>One Sonnet-class pass via <code>/kiro:impl-fast</code></td><td>Use <code>--impl-model opus</code> or switch to <code>/kiro:impl</code> if the work is not actually low risk.</td></tr>
          </tbody>
        </table>
        <p>See <a href="#model-policy">Model Policy</a> for the full rule.</p>
      </section>
    `
  },
  {
    group: "Guides",
    id: "multi-repo-workflow",
    title: "Multi-Repo Workflow",
    summary: "Coordinate cross-repository work without duplicating the source spec.",
    badges: ["Guide", "Spec"],
    content: `
      <section class="section">
        <h1>Multi-Repo Workflow</h1>
        <p>Use one repository as the source of truth for the spec, then link satellite repositories to it. Do not let each repo invent its own version of the same feature.</p>
        <pre><code># Parent repo
/kiro:discovery "..."
/kiro:spec-init "..."

# Satellite repo
/kiro:spec-link --from &lt;parent&gt; --spec &lt;feature&gt; --role satellite</code></pre>
      </section>
      <section class="section">
        <h2>Rules</h2>
        <ul>
          <li>One repo owns requirements and design decisions.</li>
          <li>Satellite repos document their local responsibilities and constraints.</li>
          <li>Unknown cross-repo impact is marked unverified, not guessed.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Guides",
    id: "retrospective-workflow",
    title: "Retrospective Workflow",
    summary: "Capture what worked, what hurt, and what should improve after the session.",
    badges: ["Learning"],
    content: `
      <section class="section">
        <h1>Retrospective Workflow</h1>
        <p>Run the retrospective at the end of the same session while the friction is still fresh.</p>
        <pre><code>/kiro:retrospective &lt;feature&gt;</code></pre>
      </section>
      <section class="section">
        <h2>What To Capture</h2>
        <ul>
          <li>Where Compass asked useful questions.</li>
          <li>Where it asked too much or too little.</li>
          <li>Which checks caught real issues.</li>
          <li>Which project rules should move into steering.</li>
          <li>What should change in the workflow itself.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Command Reference",
    id: "spec-quick",
    title: "/kiro:spec-quick",
    summary: "Generate a right-sized spec for small or medium work.",
    badges: ["Spec"],
    content: `
      <section class="section">
        <h1>/kiro:spec-quick</h1>
        <p>Use this when a change needs a durable record but should not pay the full requirements, design, and task ceremony by default. It classifies the request and creates the smallest lifecycle-valid spec that still preserves intent.</p>
        <pre><code>/kiro:spec-quick "Add validation for empty display name" --auto
/kiro:spec-quick "Fix null crash on empty address line 2" --bug
/kiro:spec-quick "Add retryCount to PaymentConfig, default 3" --minimal
/kiro:spec-quick "Add checkout notification preferences" --standard --design</code></pre>
      </section>
      <section class="section">
        <h2>Depth Modes</h2>
        <table>
          <thead><tr><th>Mode</th><th>Use when</th><th>What it creates</th></tr></thead>
          <tbody>
            <tr><td><code>MINIMAL</code></td><td>A few lines, low risk, one obvious behavior, roughly 0-3 tasks.</td><td><code>spec.json</code>, compact intent doc, <code>tasks.md</code>; pre-approved and ready for <code>/kiro:impl-fast</code>.</td></tr>
            <tr><td><code>STANDARD</code></td><td>Multiple behaviors, a real feature, cross-component work, or anything where a late mistake is expensive.</td><td>Requirements or bugfix analysis, optional design, tasks, and sanity review.</td></tr>
            <tr><td><code>Redline</code></td><td>Money, auth, security, IO-critical paths, migrations, public contracts, concurrency, or cross-service work.</td><td>Always STANDARD. <code>--minimal</code> is refused for this tier.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Flags</h2>
        <table>
          <thead><tr><th>Flag</th><th>Use when</th></tr></thead>
          <tbody>
            <tr><td><code>--auto</code></td><td>Run without interactive prompts. Useful in batch or when the scope is already clear.</td></tr>
            <tr><td><code>--minimal</code></td><td>Force the minimal path for tiny low-risk work. Redline work overrides this.</td></tr>
            <tr><td><code>--standard</code></td><td>Force the fuller path when you want the spec trail even if the change looks small.</td></tr>
            <tr><td><code>--design</code></td><td>Force design inside STANDARD when architecture or contracts need explicit review.</td></tr>
            <tr><td><code>--no-design</code></td><td>Skip design inside STANDARD for bounded work that needs requirements and tasks but no architecture decision.</td></tr>
            <tr><td><code>--bug</code></td><td>Create a bugfix spec with current behavior, expected behavior, and unchanged behavior guardrails.</td></tr>
            <tr><td><code>--chore</code></td><td>Classify the work as mechanical upkeep rather than a feature or bug.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Command Reference",
    id: "impl",
    title: "/kiro:impl",
    summary: "Implement approved tasks with review and validation.",
    badges: ["Implementation"],
    content: `
      <section class="section">
        <h1>/kiro:impl</h1>
        <p>Use <code>/kiro:impl</code> after tasks are approved. This is the normal implementation path for behavior changes, risky work, and anything where task-local evidence matters.</p>
        <pre><code>/kiro:impl checkout-notification-preferences
/kiro:impl checkout-notification-preferences 1,2
/kiro:impl checkout-notification-preferences --review inline --validate
/kiro:impl checkout-notification-preferences --review required --impl-model opus --no-commit</code></pre>
      </section>
      <section class="section">
        <h2>TDD Shape</h2>
        <p>Normal implementation is built around RED/GREEN practice. Tasks generated by <code>/kiro:spec-tasks</code> are milestone-shaped: write tests first, see the expected RED failure, implement the milestone, then run the GREEN build/test/smoke gate before marking work complete.</p>
        <div class="flow">
          <div class="flow-step"><strong>RED</strong>Write behavior tests from requirements and acceptance criteria.</div>
          <div class="flow-step"><strong>Implement</strong>Stay inside the task boundary and follow steering/design.</div>
          <div class="flow-step"><strong>GREEN</strong>Run scoped or full build/tests and fix new failures.</div>
          <div class="flow-step"><strong>Verify</strong>Use fresh evidence before marking tasks done.</div>
        </div>
      </section>
      <section class="section">
        <h2>Modes And Flags</h2>
        <table>
          <thead><tr><th>Flag or form</th><th>Use when</th></tr></thead>
          <tbody>
            <tr><td><code>/kiro:impl &lt;feature&gt;</code></td><td>Autonomous mode: implement all pending approved task milestones.</td></tr>
            <tr><td><code>/kiro:impl &lt;feature&gt; 1,2</code></td><td>Manual subset mode: implement only selected task numbers.</td></tr>
            <tr><td><code>--review off</code></td><td>Default. No per-task reviewer; rely on RED/GREEN, fresh evidence checks, and final validation.</td></tr>
            <tr><td><code>--review inline</code></td><td>Run a lighter review in the main context for behavioral work.</td></tr>
            <tr><td><code>--review required</code></td><td>Use a fresh reviewer subagent per task. Prefer for money, auth, IO-critical, or contract-heavy changes.</td></tr>
            <tr><td><code>--validate</code></td><td>Run <code>/kiro:validate-impl</code> after implementation for a deeper cross-task audit.</td></tr>
            <tr><td><code>--impl-model sonnet|opus</code></td><td>Choose the code-writing model. Sonnet is the default; Opus is the higher-cost quality option.</td></tr>
            <tr><td><code>--commit</code> / <code>--no-commit</code></td><td>Override the spec commit policy for this run only.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Model Policy</h2>
        <p><code>/kiro:impl</code> runs orchestration, review, debug, validation, and completion checks in the main session. Non-trivial code-writing milestones default to fresh Sonnet-class implementer subagents, with the approved spec and steering injected into their task brief.</p>
        <div class="callout"><strong>Use <code>--impl-model opus</code> when:</strong> the implementation itself needs the higher model, not just the surrounding design and gates. Typical cases are security-sensitive logic, complex migrations, concurrency, subtle algorithms, or a prior cheaper-model attempt that drifted from the spec.</div>
      </section>
      <section class="section">
        <h2>What It Protects</h2>
        <ul>
          <li>Never commits directly to protected branches.</li>
          <li>Runs a baseline before code so pre-existing failures are not blamed on the task.</li>
          <li>Uses task boundaries, dependencies, and parallel markers to avoid unsafe overlap.</li>
          <li>Stages files explicitly; it should not use broad <code>git add -A</code>.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Command Reference",
    id: "impl-fast",
    title: "/kiro:impl-fast",
    summary: "A lighter implementation path for small scoped changes.",
    badges: ["Implementation"],
    content: `
      <section class="section">
        <h1>/kiro:impl-fast</h1>
        <p>Use <code>/kiro:impl-fast</code> after <code>/kiro:spec-quick</code> for small, scoped, low-risk work. It trades per-task safety for speed: implementation is sequential, code is written directly, and build/test/review/verify run once at the end.</p>
        <pre><code>/kiro:impl-fast empty-display-name-validation
/kiro:impl-fast empty-display-name-validation 1,2 --validate
/kiro:impl-fast dependency-version-bump --no-tests --no-commit
/kiro:impl-fast --direct "Fix typo in settings page label"</code></pre>
        <div class="callout warn"><strong>Do not use for redline changes.</strong> Auth, money, public contracts, migrations, concurrency, cross-service work, and expensive-to-debug behavioral changes should use <code>/kiro:impl</code>.</div>
      </section>
      <section class="section">
        <h2>What It Drops vs Keeps</h2>
        <table>
          <thead><tr><th>Drops for speed</th><th>Keeps as the floor</th></tr></thead>
          <tbody>
            <tr><td>Per-task subagent dispatch, parallel waves, per-task RED/GREEN, feature-flag RED/GREEN, and per-task reviewer subagents.</td><td>Spec grounding, approval checks, steering, selective staging, one build/test gate, one inline review, and the internal fresh-evidence verification protocol.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Model Policy</h2>
        <p><code>/kiro:impl-fast</code> keeps the same role split but compresses the run: one Sonnet-class writer pass by default, then one higher-model build/review/verify gate in the main context. Use <code>--impl-model opus</code> when the change is still small but the implementation needs maximum reasoning.</p>
      </section>
      <section class="section">
        <h2>Flags</h2>
        <table>
          <thead><tr><th>Flag</th><th>Use when</th></tr></thead>
          <tbody>
            <tr><td><code>[task-numbers]</code></td><td>Limit the run to selected tasks; otherwise all pending tasks run sequentially.</td></tr>
            <tr><td><code>--no-tests</code></td><td>Skip writing new tests for low-risk changes. The end build/smoke gate still runs.</td></tr>
            <tr><td><code>--validate</code></td><td>Run final <code>/kiro:validate-impl</code> after the fast implementation gate.</td></tr>
            <tr><td><code>--impl-model sonnet|opus</code></td><td>Choose the code-writing model. Sonnet is default; Opus is for max quality at higher cost.</td></tr>
            <tr><td><code>--commit</code> / <code>--no-commit</code></td><td>Override whether the run commits or leaves the working tree uncommitted.</td></tr>
            <tr><td><code>--direct "..."</code></td><td>Spec-less mode for user-approved cosmetic or non-behavioral edits only. It records no spec artifacts.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Direct Mode Guardrails</h2>
        <p><code>--direct</code> exists for cosmetic changes routed by discovery: copy, labels, formatting, comments, docs, CSS, one config value, or a UI control that reuses an existing handler. If the change is behavioral, a bug fix, or redline, capture it first with <code>/kiro:spec-quick "..." --bug</code> or a full spec.</p>
      </section>
    `
  },
  {
    group: "Operate",
    id: "update-rollback",
    title: "Update and Rollback",
    summary: "Update Compass or roll back to an existing Kiro plugin.",
    badges: ["Operate"],
    content: `
      <section class="section">
        <h1>Update and Rollback</h1>
        <h2>Update</h2>
        <pre><code>/plugin marketplace update kiro-compass
/plugin update kiro@kiro-compass
/reload-plugins
/plugin details kiro@kiro-compass</code></pre>
        <h2>Rollback</h2>
        <pre><code>/plugin uninstall kiro@kiro-compass
/plugin install kiro@&lt;previous-marketplace&gt;
/reload-plugins</code></pre>
      </section>
    `
  },
  {
    group: "Operate",
    id: "troubleshooting",
    title: "Fix Missing Commands",
    summary: "Runbooks for missing /kiro commands and marketplace issues.",
    badges: ["Operate"],
    content: `
      <section class="section">
        <h1>Fix Missing Commands</h1>
        <ol>
          <li>Run <code>/plugin list</code>.</li>
          <li>Confirm <code>kiro@kiro-compass</code> is installed and enabled.</li>
          <li>Run <code>/reload-plugins</code>.</li>
          <li>Restart Claude Code if needed.</li>
          <li>Run <code>/kiro:doctor</code>.</li>
        </ol>
      </section>
      <section class="section">
        <h2>Two Kiro Plugins Are Installed</h2>
        <pre><code>/plugin uninstall kiro@&lt;other-marketplace&gt;
/reload-plugins
/plugin install kiro@kiro-compass
/reload-plugins</code></pre>
      </section>
    `
  },
  {
    group: "Reference",
    id: "release-versioning",
    title: "Release and Versioning",
    summary: "How source, release, and GitHub Pages branches differ.",
    badges: ["Reference"],
    content: `
      <section class="section">
        <h1>Release and Versioning</h1>
        <table>
          <thead><tr><th>Branch</th><th>Role</th></tr></thead>
          <tbody>
            <tr><td><code>main</code></td><td>Source templates, builder, tests, and contribution workflow.</td></tr>
            <tr><td><code>release</code></td><td>Generated installable plugin artifact with marketplace metadata.</td></tr>
            <tr><td><code>gh-pages</code></td><td>Published website branch.</td></tr>
          </tbody>
        </table>
        <h2>Why Release Is Generated</h2>
        <ul>
          <li>Users install an artifact, not source templates.</li>
          <li>Deletes in source must remove generated files.</li>
          <li>A fresh release tree avoids stale plugin files.</li>
        </ul>
      </section>
    `
  }
];

const examplePages = [
  {
    group: "Examples",
    id: "example-small-validation",
    title: "Example: Add a Small Validation",
    summary: "A compact path for a low-risk validation change.",
    badges: ["Example"],
    content: `
      <section class="section">
        <h1>Example: Add a Small Validation</h1>
        <p>Use this when the behavior is clear, the blast radius is small, and a compact artifact is enough.</p>
        <pre><code>/kiro:spec-quick "Add validation for empty display name" --auto
/kiro:impl-fast &lt;feature&gt; --validate</code></pre>
      </section>
      <section class="section">
        <h2>Review Points</h2>
        <ul>
          <li>Broken and fixed behavior are both explicit.</li>
          <li>The validation location matches existing project patterns.</li>
          <li>The verification command would fail without the change.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Examples",
    id: "example-new-feature",
    title: "Example: Build a New Feature",
    summary: "Start from a rough idea, let discovery clarify it, then proceed through the full lifecycle.",
    badges: ["Example", "Spec"],
    content: `
      <section class="section">
        <h1>Example: Build a New Feature</h1>
        <pre><code>/kiro:discovery "Let users manage checkout notification preferences"
/kiro:spec-init "Checkout notification preferences"
/kiro:spec-requirements &lt;feature&gt;
/kiro:spec-design &lt;feature&gt;
/kiro:validate-design &lt;feature&gt;
/kiro:spec-tasks &lt;feature&gt;
/kiro:impl &lt;feature&gt;
/kiro:validate-impl &lt;feature&gt;</code></pre>
      </section>
      <section class="section">
        <h2>Why Discovery Comes First</h2>
        <p>The one-line idea hides product and engineering choices: preference owner, channels, defaults, consent, storage, enforcement point, and migration. Discovery turns those into explicit questions before the requirements document exists.</p>
      </section>
    `
  },
  {
    group: "Examples",
    id: "example-failing-test",
    title: "Example: Fix a Failing Test",
    summary: "Use debug to find root cause before generating a fix.",
    badges: ["Example", "Debug"],
    content: `
      <section class="section">
        <h1>Example: Fix a Failing Test</h1>
        <pre><code>/kiro:debug "UserPreferencesRepository test fails when notification channel is null"
/kiro:spec-quick "Fix null notification channel handling" --auto
/kiro:impl &lt;feature&gt;
/kiro:validate-impl &lt;feature&gt;</code></pre>
      </section>
      <section class="section">
        <h2>Review Points</h2>
        <ul>
          <li>The root cause is named before the implementation starts.</li>
          <li>The fix is smaller than the symptom.</li>
          <li>The final test or build command proves the failure cannot recur silently.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Examples",
    id: "example-risky-design",
    title: "Example: Review a Risky Design",
    summary: "Use design validation when a plan touches contracts, data, retries, or failure behavior.",
    badges: ["Example", "Validation"],
    content: `
      <section class="section">
        <h1>Example: Review a Risky Design</h1>
        <pre><code>/kiro:spec-design &lt;feature&gt;
/kiro:validate-design &lt;feature&gt;</code></pre>
        <p>Design validation should read the real code paths, challenge assumptions, and return concrete fix options before tasks are generated.</p>
      </section>
      <section class="section">
        <h2>Use This For</h2>
        <ul>
          <li>Payment, auth, notification, migration, or data-integrity changes.</li>
          <li>Plans that depend on existing behavior the author has not verified.</li>
          <li>Changes where an incorrect task list would create a large bad diff.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Examples",
    id: "example-multi-repo",
    title: "Example: Link a Satellite Repo",
    summary: "Coordinate work across repositories while keeping one source spec.",
    badges: ["Example", "Spec"],
    content: `
      <section class="section">
        <h1>Example: Link a Satellite Repo</h1>
        <pre><code># Source repo
/kiro:discovery "Add new checkout notification preference across app and service"
/kiro:spec-init "Checkout notification preference"

# Satellite repo
/kiro:spec-link --from ../source-repo --spec checkout-notification-preference --role satellite
/kiro:spec-status checkout-notification-preference</code></pre>
      </section>
      <section class="section">
        <h2>Expected Result</h2>
        <p>The satellite repo records its local responsibility without copying or drifting from the parent spec.</p>
      </section>
    `
  }
];

const referencePages = [
  {
    group: "Reference",
    id: "files-folders",
    title: "Files and Folders",
    summary: "Where Compass stores steering, specs, generated artifacts, and plugin files.",
    badges: ["Reference"],
    content: `
      <section class="section">
        <h1>Files and Folders</h1>
        <table>
          <thead><tr><th>Path</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>.kiro/steering/</code></td><td>Project-wide memory: product, tech, structure, and custom durable rules.</td></tr>
            <tr><td><code>.kiro/specs/</code></td><td>Feature-scoped requirements, design, tasks, decisions, and validation records.</td></tr>
            <tr><td><code>.claude/</code></td><td>Claude Code commands, skills, hooks, or settings installed by the plugin.</td></tr>
            <tr><td><code>CLAUDE.md</code></td><td>Agent-facing project entry point when installed for Claude Code.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Rule of Thumb</h2>
        <p>Put project-wide guidance in steering. Put feature-specific decisions in the spec. Put implementation evidence in validation or task notes.</p>
      </section>
    `
  },
  {
    group: "Reference",
    id: "requirements-format",
    title: "Requirements Format",
    summary: "How Compass requirements should describe behavior without leaking into design.",
    badges: ["Reference", "Spec"],
    content: `
      <section class="section">
        <h1>Requirements Format</h1>
        <p>Requirements define what must be true for users and systems. They should avoid premature file names, classes, and implementation mechanics unless those are part of a public contract.</p>
        <table>
          <thead><tr><th>Include</th><th>Avoid</th></tr></thead>
          <tbody>
            <tr><td>User-visible behavior and acceptance criteria.</td><td>Unreviewed implementation guesses.</td></tr>
            <tr><td>Constraints, non-goals, and edge cases.</td><td>Vague language like "handle properly" without observable outcomes.</td></tr>
            <tr><td>Open questions that affect scope.</td><td>Hiding uncertainty as if it were decided.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Reference",
    id: "design-documents",
    title: "Design Documents",
    summary: "What belongs in HLD, LLD, and full design documents.",
    badges: ["Reference", "Design"],
    content: `
      <section class="section">
        <h1>Design Documents</h1>
        <table>
          <thead><tr><th>Document</th><th>Use when</th></tr></thead>
          <tbody>
            <tr><td><code>design.md</code></td><td>One design document is enough for the change.</td></tr>
            <tr><td><code>design-hld.md</code></td><td>Architecture, ownership, data flow, or system boundaries need review first.</td></tr>
            <tr><td><code>design-lld.md</code></td><td>Interfaces, contracts, classes, queries, and detailed behavior need a second pass.</td></tr>
          </tbody>
        </table>
      </section>
      <section class="section">
        <h2>Design Must Be Grounded</h2>
        <p>If the design depends on current code behavior, it should cite or summarize the local evidence. If evidence is unavailable, mark the claim unverified.</p>
      </section>
    `
  },
  {
    group: "Reference",
    id: "task-format",
    title: "Task Format",
    summary: "What makes a Compass task implementable and reviewable.",
    badges: ["Reference", "Implementation"],
    content: `
      <section class="section">
        <h1>Task Format</h1>
        <p>Tasks should be small enough to implement, review, and verify independently.</p>
        <ul>
          <li>Each task names the behavior or code area it changes.</li>
          <li>Dependencies are explicit.</li>
          <li>Verification is attached to the task, not left for the end.</li>
          <li>Risky migrations, contracts, and failure paths are separate tasks.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Reference",
    id: "review-validation-gates",
    title: "Review and Validation Gates",
    summary: "What each Compass validation command is expected to prove.",
    badges: ["Reference", "Validation"],
    content: `
      <section class="section">
        <h1>Review and Validation Gates</h1>
        <table>
          <thead><tr><th>Command</th><th>Proves</th></tr></thead>
          <tbody>
            <tr><td><code>/kiro:validate-design</code></td><td>The design is feasible, grounded, and complete enough for tasks.</td></tr>
            <tr><td><code>/kiro:review</code></td><td>A task implementation matches task intent and local standards.</td></tr>
            <tr><td><code>/kiro:validate-impl</code></td><td>The full feature satisfies spec, tests, and integration expectations.</td></tr>
            <tr><td>Fresh-evidence verification</td><td>Implementation and validation flows should not claim success without current build, test, review, or runtime evidence.</td></tr>
          </tbody>
        </table>
      </section>
    `
  }
];

const customizePages = [
  {
    group: "Customize",
    id: "project-steering",
    title: "Project Steering",
    summary: "Write durable project memory before asking Compass to build.",
    badges: ["Customize", "Steering"],
    content: `
      <section class="section">
        <h1>Project Steering</h1>
        <p>Run steering early in every repository. It gives Compass the facts that should outlive one feature: product purpose, technology, structure, and team conventions.</p>
        <pre><code>/kiro:steering</code></pre>
      </section>
      <section class="section">
        <h2>Good Steering</h2>
        <ul>
          <li>Names real build and test commands.</li>
          <li>Explains module boundaries and ownership.</li>
          <li>Captures durable standards, not temporary task notes.</li>
          <li>Is updated when the repo meaningfully changes.</li>
        </ul>
      </section>
    `
  },
  {
    group: "Customize",
    id: "custom-steering",
    title: "Custom Steering",
    summary: "Add durable domain, subsystem, security, or UI rules.",
    badges: ["Customize", "Steering"],
    content: `
      <section class="section">
        <h1>Custom Steering</h1>
        <p>Use custom steering when a repository needs specialized guidance beyond product, tech, and structure.</p>
        <pre><code>/kiro:steering-custom</code></pre>
        <table>
          <thead><tr><th>Good custom steering</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td>Security rules</td><td>Token handling, PII, logging constraints.</td></tr>
            <tr><td>API standards</td><td>Error shape, pagination, idempotency, versioning.</td></tr>
            <tr><td>Testing policy</td><td>Required test layers and when mocks are acceptable.</td></tr>
            <tr><td>UI conventions</td><td>Component usage, accessibility, responsive behavior.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Customize",
    id: "team-workflow-conventions",
    title: "Team Workflow Conventions",
    summary: "Decide how your team uses fast paths, review gates, and retrospectives.",
    badges: ["Customize", "Teams"],
    content: `
      <section class="section">
        <h1>Team Workflow Conventions</h1>
        <p>Compass gives you the workflow primitives. Teams should decide when fast paths are allowed and which gates are mandatory for their risk profile.</p>
        <table>
          <thead><tr><th>Convention</th><th>Recommendation</th></tr></thead>
          <tbody>
            <tr><td>Discovery</td><td>Always use it for rough asks, ambiguous product language, or multi-file work.</td></tr>
            <tr><td>Fast path</td><td>Allow for low-risk scoped work only.</td></tr>
            <tr><td>Design validation</td><td>Require for auth, money, migrations, notifications, data contracts, and cross-service work.</td></tr>
            <tr><td>Retrospective</td><td>Run after meaningful sessions so workflow learning compounds.</td></tr>
          </tbody>
        </table>
      </section>
    `
  }
];

const operatePages = [
  {
    group: "Operate",
    id: "marketplace-issues",
    title: "Fix Marketplace Issues",
    summary: "Runbook for marketplace add, update, and install failures.",
    badges: ["Operate"],
    content: `
      <section class="section">
        <h1>Fix Marketplace Issues</h1>
        <ol>
          <li>Check that Claude Code supports plugin marketplaces.</li>
          <li>Run <code>/plugin marketplace list</code> and remove stale entries.</li>
          <li>Re-add the Compass marketplace source.</li>
          <li>Run <code>/plugin install kiro@kiro-compass</code>.</li>
          <li>Run <code>/reload-plugins</code> and <code>/kiro:doctor</code>.</li>
        </ol>
        <pre><code>/plugin marketplace add scapia-oss/compass@release
/plugin install kiro@kiro-compass
/reload-plugins
/kiro:doctor</code></pre>
      </section>
    `
  },
  {
    group: "Operate",
    id: "version-mismatch",
    title: "Fix Plugin Version Mismatch",
    summary: "What to do when teammates have newer commands than you.",
    badges: ["Operate"],
    content: `
      <section class="section">
        <h1>Fix Plugin Version Mismatch</h1>
        <p>If a command exists for a teammate but not for you, your marketplace or plugin install is usually stale.</p>
        <pre><code>/plugin marketplace update kiro-compass
/plugin update kiro@kiro-compass
/reload-plugins
/plugin details kiro@kiro-compass
/kiro:doctor</code></pre>
      </section>
    `
  },
  {
    group: "Operate",
    id: "faq",
    title: "FAQ",
    summary: "Short answers to common Compass workflow questions.",
    badges: ["FAQ"],
    content: `
      <section class="section">
        <h1>FAQ</h1>
        <h2>Can I skip discovery?</h2>
        <p>Only when the work is already scoped and low ambiguity. For rough requests, discovery is the step that prevents the rest of the workflow from inheriting a bad guess.</p>
        <h2>Can I just ask Claude Code directly?</h2>
        <p>Yes for throwaway exploration. Use Compass when the work needs shared context, reviewable artifacts, or implementation confidence.</p>
        <h2>When should I use <code>/kiro:impl-fast</code>?</h2>
        <p>Use it after <code>/kiro:spec-quick</code> for small, low-risk changes. Do not use it for auth, money, migrations, public contracts, or cross-service behavior.</p>
        <h2>Why run retrospectives?</h2>
        <p>Because workflow quality improves only when friction is recorded. Keep it short, blunt, and in the same session.</p>
      </section>
    `
  }
];

const contributorPages = [
  {
    group: "Contributors",
    id: "contributor-repo-structure",
    title: "Repository Structure",
    summary: "How contributors should think about source, generated release artifacts, and docs.",
    badges: ["Contribute"],
    content: `
      <section class="section">
        <h1>Repository Structure</h1>
        <p>Compass separates source, installable artifacts, and website content by branch.</p>
        <table>
          <thead><tr><th>Branch</th><th>Contributor meaning</th></tr></thead>
          <tbody>
            <tr><td><code>main</code></td><td>Source templates, tests, and contribution workflow.</td></tr>
            <tr><td><code>release</code></td><td>Generated plugin tree users install from.</td></tr>
            <tr><td><code>gh-pages</code></td><td>Static website content.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
  {
    group: "Contributors",
    id: "release-flow",
    title: "Release Flow",
    summary: "The high-level publishing model for Compass.",
    badges: ["Contribute", "Release"],
    content: `
      <section class="section">
        <h1>Release Flow</h1>
        <ol>
          <li>Change source templates and tests on the source branch.</li>
          <li>Generate a clean release branch artifact.</li>
          <li>Install and verify from the generated release branch.</li>
          <li>Update website docs on <code>gh-pages</code> when user-facing behavior changes.</li>
        </ol>
        <div class="callout"><strong>Do not hand-edit release artifacts as source.</strong> Source changes should flow into the generated release tree.</div>
      </section>
    `
  }
];

const commandReferencePages = [
  {
    id: "kiro-steering",
    title: "/kiro:steering",
    summary: "Bootstrap or refresh project-wide memory.",
    useWhen: "Run this before the first real spec in a repository, after a large refactor, or whenever Compass keeps missing project conventions.",
    avoid: "Do not put one feature's temporary implementation notes into steering. Put those in the spec.",
    reads: "Repository docs, build files, source layout, package manifests, and existing conventions.",
    writes: ".kiro/steering/product.md, .kiro/steering/tech.md, and .kiro/steering/structure.md.",
    produces: "A durable project-memory baseline used by discovery, requirements, design, tasks, implementation, and validation.",
    examples: ["/kiro:steering"],
    flags: [],
    next: "/kiro:discovery \"Add the change you want\""
  },
  {
    id: "kiro-steering-custom",
    title: "/kiro:steering-custom",
    summary: "Create specialized durable steering for team or subsystem rules.",
    useWhen: "Use this for API standards, security rules, testing policy, UI conventions, data rules, deployment constraints, or domain-specific behavior that should apply across many specs.",
    avoid: "Do not use custom steering for one-off task notes or feature-local decisions.",
    reads: "Existing steering files, repo conventions, and the domain area you want to standardize.",
    writes: "Additional Markdown files under .kiro/steering/.",
    produces: "Focused guidance future commands can load without rediscovering the rule.",
    examples: ["/kiro:steering-custom"],
    flags: [],
    next: "/kiro:discovery \"...\""
  },
  {
    id: "spec-init",
    title: "/kiro:spec-init",
    summary: "Initialize a full spec with guided workflow selection.",
    useWhen: "Discovery says the work needs a normal spec, or you already know this is meaningful behavior, risky work, or a multi-step feature.",
    avoid: "Do not use it for typo/config/copy changes that discovery or spec-quick can handle faster.",
    reads: "Your description, steering, optional discovery brief, triage criteria, and a light codebase scan.",
    writes: "A categorized spec directory under .kiro/specs/ with spec.json plus the first intent artifact.",
    produces: "A spec configured as feature, bugfix, tech-debt, or chore, with the right artifact path selected.",
    examples: ["/kiro:spec-init \"Add checkout notification preferences\"", "/kiro:spec-init \"Fix crash when uploading large files\"", "/kiro:spec-init \"Build notification system\" --no-triage", "/kiro:spec-init \"Add mobile checkout flow\" --flutter"],
    flags: [["--no-triage", "Skip the mandatory triage scan when you intentionally want a spec anyway."], ["--flutter", "Mark the spec as Flutter/mobile and enable mobile E2E considerations such as Maestro when configured."]],
    next: "/kiro:spec-requirements <feature>"
  },
  {
    id: "spec-requirements",
    title: "/kiro:spec-requirements",
    summary: "Write behavior requirements and acceptance criteria.",
    useWhen: "The spec exists and the team needs to agree on WHAT changes before design.",
    avoid: "Do not bury architecture or file-level implementation decisions here unless they are public contract requirements.",
    reads: "spec.json, steering, discovery brief, project description, and any existing requirements draft.",
    writes: "requirements.md, or bugfix analysis approval metadata for bugfix flows.",
    produces: "Reviewable requirements, usually with EARS-style acceptance criteria.",
    examples: ["/kiro:spec-requirements checkout-notification-preferences"],
    flags: [],
    next: "/kiro:spec-design <feature> or /kiro:validate-gap <feature>"
  },
  {
    id: "validate-gap",
    title: "/kiro:validate-gap",
    summary: "Analyze the gap between requirements and the existing codebase.",
    useWhen: "Use this for extensions to an existing system, migrations, or when you are unsure what already exists.",
    avoid: "Do not use it as a substitute for design review; it answers what exists and what is missing.",
    reads: "Requirements, steering, local code, and relevant existing spec context.",
    writes: "gap-analysis.md and a research.md summary for downstream design.",
    produces: "Known gaps, integration risks, existing behaviors to preserve, and areas the design must address.",
    examples: ["/kiro:validate-gap checkout-notification-preferences"],
    flags: [],
    next: "/kiro:spec-design <feature>"
  },
  {
    id: "spec-design",
    title: "/kiro:spec-design",
    summary: "Generate a single technical design from approved requirements.",
    useWhen: "Use for legacy or monolithic design specs where one design.md is enough.",
    avoid: "If the spec is configured for split HLD/LLD, use /kiro:spec-design-hld and /kiro:spec-design-lld instead.",
    reads: "requirements.md, spec.json, steering, research.md, design principles, and local code evidence.",
    writes: "design.md and research.md grounding notes.",
    produces: "A boundary-first technical approach with file structure plan, testing strategy, and risks.",
    examples: ["/kiro:spec-design checkout-notification-preferences", "/kiro:spec-design checkout-notification-preferences -y"],
    flags: [["-y", "Auto-approve upstream requirements for low-risk specs; default is human review first."]],
    next: "/kiro:validate-design <feature>"
  },
  {
    id: "spec-design-hld",
    title: "/kiro:spec-design-hld",
    summary: "Generate high-level design: architecture, flows, ownership, and boundaries.",
    useWhen: "Use when a feature needs architectural review before low-level contracts.",
    avoid: "Do not use it for tiny bounded work where spec-quick skipped design.",
    reads: "Requirements, steering, research, existing code, and cross-repo/contract signals.",
    writes: "design-hld.md.",
    produces: "Architecture, major flows, change surface, boundary commitments, and downstream revalidation triggers.",
    examples: ["/kiro:spec-design-hld checkout-notification-preferences", "/kiro:spec-design-hld checkout-notification-preferences -y"],
    flags: [["-y", "Auto-approve the previous gate for low-risk specs."]],
    next: "/kiro:spec-design-lld <feature>"
  },
  {
    id: "spec-design-lld",
    title: "/kiro:spec-design-lld",
    summary: "Generate low-level design: interfaces, data models, contracts, and implementation details.",
    useWhen: "Use after HLD when code-level contracts and file responsibilities need detail.",
    avoid: "Do not invent contracts that were not accepted at HLD or requirements level.",
    reads: "Approved HLD, requirements, steering, local code, and design rules.",
    writes: "design-lld.md.",
    produces: "Detailed file/interface plan that drives task boundaries.",
    examples: ["/kiro:spec-design-lld checkout-notification-preferences", "/kiro:spec-design-lld checkout-notification-preferences -y"],
    flags: [["-y", "Auto-approve the upstream design gate for low-risk specs."]],
    next: "/kiro:validate-design <feature>"
  },
  {
    id: "validate-design",
    title: "/kiro:validate-design",
    summary: "Run an adversarial, code-grounded review of the frozen design.",
    useWhen: "Run before tasks on meaningful changes, especially contracts, auth, money, data, cross-service, or high-blast-radius work.",
    avoid: "Do not treat it as a style pass. It should find design problems that would make implementation wrong or expensive.",
    reads: "Design docs, requirements or bugfix analysis, steering, local code evidence, and review rules.",
    writes: "design-review.md and, when useful, learnings.md.",
    produces: "GO, NO-GO, or caveated findings with evidence, impact, suggestion, and traceability.",
    examples: ["/kiro:validate-design checkout-notification-preferences"],
    flags: [],
    next: "/kiro:spec-tasks <feature>"
  },
  {
    id: "spec-tasks",
    title: "/kiro:spec-tasks",
    summary: "Generate executable implementation milestones from requirements and design.",
    useWhen: "Run after requirements and enabled design artifacts are approved.",
    avoid: "Do not use it to paper over design gaps. If the task graph exposes a contradiction, go back to design.",
    reads: "spec.json, requirements or bugfix.md, enabled design docs, steering, task-generation rules, test-value guidance, and existing tasks.md if merging.",
    writes: "tasks.md and task approval metadata in spec.json.",
    produces: "Milestone-shaped tasks: RED test step, implementation steps, integration/verify GREEN gate, boundaries, dependencies, and optional (P) parallel markers.",
    examples: ["/kiro:spec-tasks checkout-notification-preferences", "/kiro:spec-tasks checkout-notification-preferences -y", "/kiro:spec-tasks checkout-notification-preferences --sequential"],
    flags: [["-y", "Auto-approve generated tasks after the task-plan review."], ["--sequential", "Omit parallel (P) markers when you want strictly ordered execution."]],
    next: "/kiro:impl <feature>"
  },
  {
    id: "spec-status",
    title: "/kiro:spec-status",
    summary: "Show where a spec stands and what command should run next.",
    useWhen: "Use when resuming work, joining someone else's spec, or unsure which phase is complete.",
    avoid: "Do not infer readiness from filenames alone; status checks the spec lifecycle state.",
    reads: "spec.json and spec artifacts under the resolved spec directory.",
    writes: "Usually read-only.",
    produces: "Current phase, generated/approved gates, missing files, and next action.",
    examples: ["/kiro:spec-status checkout-notification-preferences"],
    flags: [],
    next: "Run the command printed by status."
  },
  {
    id: "kiro-next",
    title: "/kiro:next",
    summary: "Show where you are in the Compass workflow and the exact next command.",
    useWhen: "Use when you feel lost in the spec workflow, forget which feature you were on, or just want a fast \"what now\" answer without a full status report.",
    avoid: "Do not use it to compare gates across many specs; use /kiro:spec-status <feature> for a fuller lifecycle report.",
    reads: "spec.json and spec artifacts under the resolved (or most recently active) spec directory.",
    writes: "Nothing. Read-only by design.",
    produces: "A compact, evidence-backed next command, auto-detecting the most recent unfinished spec when no feature is named.",
    examples: ["/kiro:next", "/kiro:next checkout-notification-preferences"],
    flags: [],
    next: "Run the command it prints."
  },
  {
    id: "spec-batch",
    title: "/kiro:spec-batch",
    summary: "Create multiple specs from a discovery roadmap.",
    useWhen: "Discovery produced roadmap.md because the idea naturally splits into multiple related specs.",
    avoid: "Do not use it when the work is actually one bounded spec or when dependencies are still unclear.",
    reads: "roadmap.md, per-feature brief.md files, steering, dependency ordering, and boundary hints.",
    writes: "Multiple spec directories with requirements, design, and tasks by dependency wave.",
    produces: "A coordinated multi-spec set that can be implemented in safe dependency order.",
    examples: ["/kiro:spec-batch", "/kiro:spec-batch --auto"],
    flags: [["--auto", "Run batch creation without stopping for each phase prompt where safe."]],
    next: "/kiro:spec-status <feature>"
  },
  {
    id: "spec-link",
    title: "/kiro:spec-link",
    summary: "Create or refresh a pointer from this repo to a spec owned elsewhere.",
    useWhen: "This repo is a satellite or peer in multi-repo work and should not duplicate the source spec.",
    avoid: "Do not use it to avoid creating a real spec in a heavy repo that owns behavior.",
    reads: "Parent repo/path, parent spec identifier, local repo root, and local steering context.",
    writes: "spec-link.md plus a minimal spec.json in this repo.",
    produces: "A local pointer to the owning spec with this repo's role recorded.",
    examples: ["/kiro:spec-link --from ../checkout-service --spec features/2026-08-17-notification-preferences --role satellite", "/kiro:spec-link --from ../platform-specs --spec features/2026-08-17-contract-v2 --role peer"],
    flags: [["--from <parent>", "Path or repo reference containing the owning spec."], ["--spec <category/YYYY-MM-DD-slug>", "The exact spec path under the parent .kiro/specs directory."], ["--role satellite|peer", "satellite for light child work, peer for heavy split work."]],
    next: "/kiro:spec-status <feature>"
  },
  {
    id: "review",
    title: "/kiro:review",
    summary: "Review a task implementation against the approved spec and evidence.",
    useWhen: "Use after a task is implemented, after remediation, or when /kiro:impl was run with review enabled.",
    avoid: "Do not use it as a whole-feature validator; use /kiro:validate-impl for cross-task checks.",
    reads: "Task ID, diff, requirements, design, steering, verification output, and task boundaries.",
    writes: "Review findings or remediation notes.",
    produces: "Accept/reject-style findings with concrete issues and evidence.",
    examples: ["/kiro:review 2.1"],
    flags: [],
    next: "/kiro:validate-impl <feature> when the feature is ready"
  },
  {
    id: "validate-impl",
    title: "/kiro:validate-impl",
    summary: "Validate feature-level integration after implementation.",
    useWhen: "Run after all tasks are implemented, before PR/handoff, or after /kiro:impl --validate.",
    avoid: "Do not use it as a replacement for task-local review. It catches cross-task and feature-level drift.",
    reads: "Spec artifacts, completed tasks, code diff, tests/build output, local code, and changed shared surfaces.",
    writes: "impl-validation.md and relevant learnings.",
    produces: "GO, NO-GO, or MANUAL_VERIFY_REQUIRED with mechanical checks, spec alignment, test evidence, and shared-regression analysis.",
    examples: ["/kiro:validate-impl checkout-notification-preferences", "/kiro:validate-impl checkout-notification-preferences --regression", "/kiro:validate-impl checkout-notification-preferences 1,2"],
    flags: [["[task-numbers]", "Validate an explicit subset instead of whole-feature completion."], ["--regression", "Force shared-component regression review even when the auto-trigger does not fire."]],
    next: "/kiro:retrospective <feature>"
  },
  {
    id: "debug",
    title: "/kiro:debug",
    summary: "Investigate implementation failures root-cause-first.",
    useWhen: "Use when tests fail, an implementer is blocked, validation fails, or repeated remediation is not converging.",
    avoid: "Do not ask it for a speculative patch before evidence is gathered.",
    reads: "Failure output, relevant code, repo state, spec artifacts, reviewer feedback, and local runtime evidence.",
    writes: "Debug report or remediation guidance; learnings when a general trap is found.",
    produces: "Root cause category, smallest safe next action, and NEXT_ACTION such as RETRY_TASK, BLOCK_TASK, or STOP_FOR_HUMAN.",
    examples: ["/kiro:debug \"PaymentConfig test fails after retryCount default change\"", "/kiro:debug \"validate-impl reports shared component regression\""],
    flags: [],
    next: "Rerun the failing command, continue the implementation run, or validate with /kiro:validate-impl <feature>"
  },
  {
    id: "retrospective",
    title: "/kiro:retrospective",
    summary: "Capture end-of-session feedback and framework improvement ideas.",
    useWhen: "Run at the end of a session that used Compass skills, while the pain points and useful moments are still fresh.",
    avoid: "Do not run it days later from a new context if the session details are gone.",
    reads: "Session context, spec artifacts, commands used, validation outcomes, and developer feedback.",
    writes: "feedback-<timestamp>.md and skill-improvements-<timestamp>.md.",
    produces: "A bounded developer-journey interview plus triaged improvement backlog.",
    examples: ["/kiro:retrospective checkout-notification-preferences", "/kiro:retrospective"],
    flags: [],
    next: "Promote durable lessons into steering or future Compass improvements."
  }
].map((command) => ({
  group: "Command Reference",
  id: command.id,
  title: command.title,
  summary: command.summary,
  badges: ["Command"],
  content: `
    <section class="section">
      <h1>${command.title}</h1>
      <p>${command.summary}</p>
      <h2>Examples</h2>
      <pre><code>${command.examples.join("\n")}</code></pre>
      <h2>Use When</h2>
      <p>${command.useWhen}</p>
      <h2>Do Not Use When</h2>
      <p>${command.avoid}</p>
      ${command.flags.length ? `<h2>Flags</h2>
      <table>
        <thead><tr><th>Flag</th><th>Use when</th></tr></thead>
        <tbody>${command.flags.map(([flag, note]) => `<tr><td><code>${flag}</code></td><td>${note}</td></tr>`).join("")}</tbody>
      </table>` : ""}
      <h2>What It Reads</h2>
      <p>${command.reads}</p>
      <h2>What It Writes</h2>
      <p>${command.writes}</p>
      <h2>What It Produces</h2>
      <p>${command.produces}</p>
      <h2>Next Command</h2>
      <p><code>${command.next}</code></p>
    </section>
  `
}));

pages.push(...examplePages, ...referencePages, ...customizePages, ...operatePages, ...contributorPages, ...commandReferencePages);

const groups = [...new Set(pages.map((page) => page.group))];
const nav = document.querySelector("#sidebar-nav");
const content = document.querySelector("#content");
const toc = document.querySelector("#toc-nav");
const filter = document.querySelector("#nav-filter");
const themeToggle = document.querySelector("[data-theme-toggle]");
const menuToggle = document.querySelector("[data-menu-toggle]");

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function renderNav(query = "") {
  const q = query.trim().toLowerCase();
  nav.innerHTML = groups.map((group) => {
    const matches = pages.filter((page) => page.group === group && (!q || `${page.title} ${page.summary} ${page.group}`.toLowerCase().includes(q)));
    if (!matches.length) return "";
    return `<div class="nav-group">
      <div class="nav-group-title">${group}</div>
      ${matches.map((page) => `<a class="nav-link" data-page="${page.id}" href="#${page.id}">${page.title}</a>`).join("")}
    </div>`;
  }).join("");
  markActive();
}

function renderPage() {
  const id = location.hash.replace("#", "") || "overview";
  const page = pages.find((item) => item.id === id) || pages[0];
  const decoratedContent = page.id === "overview"
    ? page.content
    : page.content.replace(
      /<h1>.*?<\/h1>/s,
      `<div class="badge-row">${page.badges.map((badge) => `<span class="badge ${badge.toLowerCase()}">${badge}</span>`).join("")}</div><h1>${page.title}</h1><p class="lead">${page.summary}</p>`,
    );
  document.title = `${page.title} - Compass docs`;
  content.innerHTML = `
    <article>
      ${decoratedContent}
      <div class="page-footer">Compass docs are served from the <code>gh-pages</code> branch.</div>
    </article>`;
  addHeadingIds();
  addCopyButtons();
  renderToc();
  markActive();
  content.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function addHeadingIds() {
  content.querySelectorAll("h2, h3").forEach((heading) => {
    if (!heading.id) heading.id = slugify(heading.textContent);
  });
}

function renderToc() {
  const headings = [...content.querySelectorAll("h2, h3")];
  toc.innerHTML = headings.map((heading) => `<a href="#${location.hash.replace("#", "") || "overview"}-${heading.id}" data-target="${heading.id}">${heading.textContent}</a>`).join("");
  toc.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById(link.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function addCopyButtons() {
  content.querySelectorAll("pre").forEach((pre) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(pre.innerText.replace("Copy", "").trim());
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy"; }, 1200);
    });
    pre.append(button);
  });
}

function markActive() {
  const id = location.hash.replace("#", "") || "overview";
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === id);
  });
}

filter.addEventListener("input", () => renderNav(filter.value));
window.addEventListener("hashchange", renderPage);

menuToggle.addEventListener("click", () => {
  const open = !document.body.classList.contains("nav-open");
  document.body.classList.toggle("nav-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLElement)) return;
  if (!event.target.matches(".nav-link")) return;
  document.body.classList.remove("nav-open");
  menuToggle.setAttribute("aria-expanded", "false");
});

themeToggle.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  localStorage.setItem("compass-theme", dark ? "dark" : "light");
  themeToggle.textContent = dark ? "Light" : "Dark";
});

const savedTheme = localStorage.getItem("compass-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  themeToggle.textContent = savedTheme === "dark" ? "Light" : "Dark";
}

renderNav();
renderPage();
