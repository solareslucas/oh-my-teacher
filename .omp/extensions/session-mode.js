// Native OMP extension: expose persistence mode, never a session path or learner data.
export default function (omp) {
  omp.on("before_agent_start", (event, ctx) => {
    const manager = ctx.sessionManager;
    const mode = typeof manager?.getSessionFile !== "function"
      ? "unknown"
      : manager.getSessionFile() === undefined
        ? "ephemeral"
        : "persistence-enabled";

    return {
      systemPrompt: [
        ...event.systemPrompt,
        `<teacher-session-mode>${mode}</teacher-session-mode>\nNative runtime notice: this describes OMP conversation persistence only, not learner-file consent or confirmed disk durability. Apply the project's Fast turns and save cadence protocol.`,
      ],
    };
  });
}
