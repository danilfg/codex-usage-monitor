# Codex Usage Monitor VS Code

Independent, local-only status bar monitor for OpenAI Codex, by danilfg. Not affiliated with OpenAI.

Requires the official OpenAI Codex VS Code extension (`openai.chatgpt`) and an existing ChatGPT sign-in. No separate login is needed if the local app server can reuse that sign-in.

## Screenshots

### Status bar

![Codex usage in the VS Code status bar](docs/images/status-bar.png)

### Hover details

![Codex quota reset dates in the VS Code tooltip](docs/images/hover-details.png)

*Screenshot from v0.1.0; v0.1.1 also displays the time zone and countdown.*

Click the indicator to open the native VS Code details popup (Quick Pick). It shows full reset dates, local time zones, remaining time and quota bars. Click outside the popup or press Escape to dismiss it. The screenshot above shows the older hover interface.

## Install locally

Clone this repository, open it in VS Code, and press F5 to launch the Extension Development Host (the official Codex extension must be installed there too). To package: `npx --yes @vscode/vsce package --no-dependencies`, then `code --install-extension codex-usage-monitor-vscode-0.1.2.vsix`. Packaging downloads a build tool; the extension itself has no runtime dependencies.

## Usage

The status bar displays remaining percentages. Click to open details with full reset dates, local time zone and countdown. Use the refresh button in the popup to refresh. Polling defaults to 60 seconds. Missing or stale data is shown explicitly, not as 100%. Settings: `codexUsageMonitor.refreshSeconds` and `codexUsageMonitor.showBars`.

## Security

The extension launches only the bundled native executable from the installed `openai.chatgpt` extension, using stdio without a shell. The only protocol messages sent are `initialize`, `initialized`, and `account/rateLimits/read`. No direct HTTP requests, credential file reads, telemetry, model prompts, or credit reset requests. The official Codex executable itself connects to OpenAI and manages authentication. VS Code extensions are not OS-sandboxed: inspect source and updates before installing.

Protocol: https://learn.chatgpt.com/docs/app-server

## Tests

Run `npm test` with Node.js 20 or newer.
