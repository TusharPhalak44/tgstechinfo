/**
 * dragState — module-level singleton for cross-component drag data.
 *
 * Why: dataTransfer.getData() is only guaranteed to work inside a 'drop'
 * handler. During 'dragover' it returns empty strings in Firefox and Safari.
 * We mirror the payload here so every handler can read it at any time.
 */

const dragState = {
  widgetType:  null,
  widgetLabel: null,
  nodeId:      null,      // set when reordering an existing canvas node

  set(type, label, id = null) {
    this.widgetType  = type  || null;
    this.widgetLabel = label || null;
    this.nodeId      = id    || null;
  },

  clear() {
    this.widgetType  = null;
    this.widgetLabel = null;
    this.nodeId      = null;
  },

  hasData() {
    return !!(this.widgetType || this.nodeId);
  },
};

export default dragState;
