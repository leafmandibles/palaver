export function selectSessionHistoryComponent(flags, components) {
  return flags.isControlPlaneEnabled()
    ? components.controlPlaneSessionHistory
    : components.thinClientSessionHistory;
}

export function createRoutes(flags, components) {
  return {
    '/': components.projectList,
    '/events': components.events,
    '/project/:project_id/sessions': selectSessionHistoryComponent(flags, components),
    '/session/:project_id/:session_id': components.session,
  };
}
