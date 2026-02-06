# Specification

## Summary
**Goal:** Fix lobby host detection and Start Game button visibility/enabled rules so the correct player can start the game under the intended player-count constraints.

**Planned changes:**
- Update lobby host detection to rely on the backend-provided host identity (not a hardcoded `playerId=1`) so the room creator is correctly marked as Host and sees host-only controls.
- Adjust Start Game button state logic so it is visible only to the host and enabled only when the room has 3–10 players; show accurate disabled states and messaging for 1–2 players and 11+ players.

**User-visible outcome:** The room creator is correctly labeled as Host and can see the Start Game button; the button enables only when 3–10 players are present and is otherwise disabled with clear UI feedback, while non-host players never see host-only start controls.
