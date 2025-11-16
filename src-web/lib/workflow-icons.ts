/**
 * Icon and color mappings for workflow nodes
 * Based on node types and subtypes
 */

/**
 * Get the emoji icon for a workflow node based on its subtype
 *
 * @param subtype - The node subtype (e.g., 'manual_trigger', 'http_request')
 * @returns Emoji string representing the node
 */
export function getNodeIcon(subtype: string): string {
  const icons: Record<string, string> = {
    // Triggers
    manual_trigger: '⚡',
    webhook_trigger: '🌐',
    timer_trigger: '⏰',
    schedule_trigger: '📅',

    // Actions - HTTP/Network
    http_request: '🌐',
    grpc_request: '⚡',
    websocket: '🔌',
    sse: '📡',

    // Actions - Communication
    email: '✉️',
    slack: '💬',
    discord: '🎮',

    // Actions - Data
    database: '🗄️',
    json: '📋',
    xml: '📄',
    csv: '📊',

    // Logic Control
    conditional: '❓',
    if_else: '🔀',
    switch: '🔄',
    loop: '🔁',
    foreach: '➰',
    parallel: '⚡',
    merge: '🔗',
    split: '✂️',

    // Utilities
    delay: '⏱️',
    transform: '🔄',
    filter: '🔍',
    sort: '📶',
    aggregate: '📈',
  };

  return icons[subtype] || '📦'; // Default icon for unknown types
}

/**
 * Get the color for a workflow node based on its type
 *
 * @param nodeType - The node type ('trigger', 'action', 'logic')
 * @returns Hex color string
 */
export function getNodeColor(nodeType: string): string {
  const colors: Record<string, string> = {
    trigger: '#10b981', // green
    action: '#8b5cf6', // purple
    logic: '#f59e0b', // amber
  };

  return colors[nodeType] || '#6366f1'; // Default indigo for unknown types
}

/**
 * Get a human-readable label for a node subtype
 *
 * @param subtype - The node subtype
 * @returns Formatted label
 */
export function getNodeLabel(subtype: string): string {
  const labels: Record<string, string> = {
    manual_trigger: 'Manual Trigger',
    webhook_trigger: 'Webhook',
    timer_trigger: 'Timer',
    schedule_trigger: 'Schedule',
    http_request: 'HTTP Request',
    grpc_request: 'gRPC Request',
    websocket: 'WebSocket',
    sse: 'Server-Sent Events',
    email: 'Email',
    slack: 'Slack',
    discord: 'Discord',
    database: 'Database',
    json: 'JSON',
    xml: 'XML',
    csv: 'CSV',
    conditional: 'Conditional',
    if_else: 'If/Else',
    switch: 'Switch',
    loop: 'Loop',
    foreach: 'For Each',
    parallel: 'Parallel',
    merge: 'Merge',
    split: 'Split',
    delay: 'Delay',
    transform: 'Transform',
    filter: 'Filter',
    sort: 'Sort',
    aggregate: 'Aggregate',
  };

  return labels[subtype] || subtype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
