function convertDurations() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  nodes.forEach((textNode) => {
    textNode.nodeValue = textNode.nodeValue.replace(/(\d+)[\s ]mins/g, (_, m) => {
      const mins = parseInt(m, 10);
      const h = Math.floor(mins / 60);
      const rem = mins % 60;
      return h > 0 ? `${h}h ${rem}m` : `${rem}m`;
    });
  });
}

chrome.storage.sync.get({ hoursMode: false }, ({ hoursMode }) => {
  if (hoursMode) convertDurations();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.hoursMode) {
    if (changes.hoursMode.newValue) convertDurations();
    else location.reload();
  }
});
